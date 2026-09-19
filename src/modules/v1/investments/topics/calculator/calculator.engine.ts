import { Injectable } from "@nestjs/common";
import {
    Topic,
    TopicInterval,
    TopicMovement,
    TopicType,
    TopicValuation
} from "../topics.entity";

export interface Performance {
    monthly: number
    yearly: number
}

export interface MonthlySummary {
    startDate: string
    endDate: string
    totalDays: number
    startValue: number
    endValue: number
    balance: number
    result: number
    capitalDays: number
    performance: Performance
    movements: TopicMovement[]
}

export interface Summary {
    currentValue: number | null
    currentAmount: number | null
    mostRecentDate: string | null
    totalDays: number
    balance: number
    result: number
    capitalDays: number
    performance: Performance
    months: MonthlySummary[]
}

export interface Period {
    from: string
    to: string
}

export interface WalletMovement extends TopicMovement {
    topicId: string
    topicName: string
    topicType: TopicType
}

export interface WalletCashFlow {
    month: string
    deposits: number
    withdrawals: number
    balance: number
    movements: number
}

export interface WalletCalendarMonth {
    month: string
    result: number
    movements: number
    measured: boolean
}

export interface WalletPosition {
    id: string
    name: string
    type: TopicType
    currentValue: number
    currentAmount: number | null
    mostRecentDate: string | null
    deposits: number
    withdrawals: number
    investedCapital: number
    result: number
    totalDays: number
    capitalDays: number
    performance: Performance
    share: number
}

export interface WalletSlice {
    topics: number
    openingValue: number
    currentValue: number
    deposits: number
    withdrawals: number
    investedCapital: number
    result: number
    totalDays: number
    capitalDays: number
    performance: Performance
    months: MonthlySummary[]
    cashFlow: WalletCashFlow[]
}

export interface WalletSegment extends WalletSlice {
    type: TopicType
    share: number
}

export interface Wallet extends WalletSlice {
    segments: WalletSegment[]
    positions: WalletPosition[]
    movements: WalletMovement[]
    calendar: WalletCalendarMonth[]
}

interface Window {
    startDate: string
    endDate: string
    totalDays: number
}

interface Measurement extends Window {
    startValue: number
    endValue: number
    balance: number
    result: number
    capitalDays: number
    movements: TopicMovement[]
}

interface Aggregate {
    totalDays: number
    balance: number
    result: number
    capitalDays: number
    performance: Performance
}

interface TopicReading {
    topic: Topic
    valuation: TopicValuation | null
    movements: TopicMovement[]
    measurements: Measurement[]
}

interface Tally {
    deposits: number
    withdrawals: number
}

@Injectable()
export class Calculator {
    private static readonly DAYS_IN_MONTH = 30
    private static readonly DAYS_IN_YEAR = 365
    private static readonly MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24

    private round(value: number, digits: number = 2): number {
        return Number(value.toFixed(digits))
    }

    private daysBetween({ fromDate, toDate }: { fromDate: string, toDate: string }): number {
        const from = new Date(fromDate).getTime()
        const to = new Date(toDate).getTime()
        return Math.round((to - from) / Calculator.MILLISECONDS_IN_DAY)
    }

    private monthOf({ date }: { date: string }): string {
        return date.slice(0, 7)
    }

    private firstDayOf({ month }: { month: string }): string {
        return `${month}-01`
    }

    private nextMonth({ month }: { month: string }): string {
        const year = Number(month.slice(0, 4))
        const index = Number(month.slice(5, 7))

        return index === 12
            ? `${year + 1}-01`
            : `${year}-${String(index + 1).padStart(2, "0")}`
    }

    private monthsBetween({ fromDate, toDate }: { fromDate: string, toDate: string }): string[] {
        const months: string[] = []
        const lastMonth = this.monthOf({ date: toDate })

        let month = this.monthOf({ date: fromDate })
        while (month <= lastMonth) {
            months.push(month)
            month = this.nextMonth({ month })
        }

        return months
    }

    private windowOf({ month, openingDate, closingDate }: {
        month: string,
        openingDate: string,
        closingDate: string
    }): Window | null {
        const monthStart = this.firstDayOf({ month })
        const monthEnd = this.firstDayOf({ month: this.nextMonth({ month }) })

        const startDate = monthStart < openingDate ? openingDate : monthStart
        const endDate = monthEnd > closingDate ? closingDate : monthEnd
        const totalDays = this.daysBetween({ fromDate: startDate, toDate: endDate })

        return totalDays > 0 ? { startDate, endDate, totalDays } : null
    }

    private capitalDaysOf({ startDate, endDate, startValue, movements }: {
        startDate: string,
        endDate: string,
        startValue: number,
        movements: TopicMovement[]
    }): number {
        let segmentStart = startDate
        let segmentValue = startValue
        let capitalDays = 0

        for (const movement of movements) {
            capitalDays += segmentValue * this.daysBetween({
                fromDate: segmentStart,
                toDate: movement.date
            })

            segmentStart = movement.date
            segmentValue += movement.value
        }

        return capitalDays + segmentValue * this.daysBetween({
            fromDate: segmentStart,
            toDate: endDate
        })
    }

    private performanceOf({ result, capitalDays }: { result: number, capitalDays: number }): Performance {
        const daily = capitalDays > 0 ? result / capitalDays : 0

        return {
            monthly: this.round(100 * daily * Calculator.DAYS_IN_MONTH),
            yearly: this.round(100 * daily * Calculator.DAYS_IN_YEAR),
        }
    }

    private aggregate({ measurements }: { measurements: Measurement[] }): Aggregate {
        let totalDays = 0
        let balance = 0
        let result = 0
        let capitalDays = 0

        measurements.forEach((measurement) => {
            totalDays += measurement.totalDays
            balance += measurement.balance
            result += measurement.result
            capitalDays += measurement.capitalDays
        });

        return {
            totalDays,
            balance,
            result,
            capitalDays,
            performance: this.performanceOf({ result, capitalDays }),
        }
    }

    private intervalAt({ day, intervals }: { day: string, intervals: TopicInterval[] }): TopicInterval | null {
        return intervals.find(
            (interval) => day >= interval.startDate && day <= interval.endDate
        ) ?? null
    }

    private valueAt({ day, intervals }: { day: string, intervals: TopicInterval[] }): number {
        const firstInterval = intervals[0]
        const lastInterval = intervals[intervals.length - 1]

        if (day <= firstInterval.startDate) return firstInterval.startValue;
        if (day >= lastInterval.endDate) return lastInterval.endValue;

        const interval = this.intervalAt({ day, intervals })
        if (interval === null) return lastInterval.endValue;

        const elapsedMovements = interval.movements.filter((movement) => movement.date < day)
        const balance = elapsedMovements.reduce((acc, movement) => acc + movement.value, 0)

        const elapsedCapitalDays = this.capitalDaysOf({
            startDate: interval.startDate,
            endDate: day,
            startValue: interval.startValue,
            movements: elapsedMovements
        })
        const intervalCapitalDays = this.capitalDaysOf({
            startDate: interval.startDate,
            endDate: interval.endDate,
            startValue: interval.startValue,
            movements: interval.movements
        })

        const accruedResult = intervalCapitalDays > 0
            ? interval.result * elapsedCapitalDays / intervalCapitalDays
            : 0

        return interval.startValue + balance + accruedResult
    }

    private measureMonth({ month, intervals, openingDate, closingDate }: {
        month: string,
        intervals: TopicInterval[],
        openingDate: string,
        closingDate: string
    }): Measurement | null {
        const window = this.windowOf({ month, openingDate, closingDate })
        if (window === null) return null;

        const startValue = this.valueAt({ day: window.startDate, intervals })
        const endValue = this.valueAt({ day: window.endDate, intervals })

        const movements = intervals
            .flatMap((interval) => interval.movements)
            .filter((movement) => movement.date >= window.startDate && movement.date < window.endDate)

        const balance = movements.reduce((acc, movement) => acc + movement.value, 0)

        return {
            ...window,
            startValue,
            endValue,
            balance,
            result: endValue - startValue - balance,
            capitalDays: this.capitalDaysOf({
                startDate: window.startDate,
                endDate: window.endDate,
                startValue,
                movements
            }),
            movements,
        }
    }

    private measureMonths({ intervals }: { intervals: TopicInterval[] }): Measurement[] {
        if (intervals.length === 0) return [];

        const openingDate = intervals[0].startDate
        const closingDate = intervals[intervals.length - 1].endDate

        return this.monthsBetween({ fromDate: openingDate, toDate: closingDate })
            .map((month) => this.measureMonth({ month, intervals, openingDate, closingDate }))
            .filter((measurement): measurement is Measurement => measurement !== null)
    }

    private async read({ topic }: { topic: Topic }): Promise<TopicReading> {
        const intervals = await topic.calculateTopicIntervals()

        return {
            topic,
            valuation: await topic.fetchLatestValuation(),
            movements: await topic.fetchMovements(),
            measurements: this.measureMonths({ intervals }),
        }
    }

    private toMonthlySummary({ measurement }: { measurement: Measurement }): MonthlySummary {
        return {
            startDate: measurement.startDate,
            endDate: measurement.endDate,
            totalDays: measurement.totalDays,
            startValue: this.round(measurement.startValue),
            endValue: this.round(measurement.endValue),
            balance: this.round(measurement.balance),
            result: this.round(measurement.result),
            capitalDays: this.round(measurement.capitalDays),
            performance: this.performanceOf({
                result: measurement.result,
                capitalDays: measurement.capitalDays
            }),
            movements: measurement.movements,
        }
    }

    private toSummary({ reading }: { reading: TopicReading }): Summary {
        const aggregate = this.aggregate({ measurements: reading.measurements })

        return {
            currentValue: reading.valuation?.value ?? null,
            currentAmount: reading.valuation?.amount ?? null,
            mostRecentDate: reading.valuation?.date ?? null,
            totalDays: aggregate.totalDays,
            balance: this.round(aggregate.balance),
            result: this.round(aggregate.result),
            capitalDays: this.round(aggregate.capitalDays),
            performance: aggregate.performance,
            months: reading.measurements.map((measurement) => this.toMonthlySummary({ measurement })),
        }
    }

    async summarize({ topic }: { topic: Topic }): Promise<Summary> {
        return this.toSummary({ reading: await this.read({ topic }) })
    }

    private tallyMovements({ movements }: { movements: TopicMovement[] }): Tally {
        let deposits = 0
        let withdrawals = 0

        movements.forEach((movement) => {
            if (movement.value >= 0) deposits += movement.value
            else withdrawals -= movement.value
        });

        return { deposits, withdrawals }
    }

    private shareOf({ value, total }: { value: number, total: number }): number {
        if (total <= 0) return 0;
        return this.round(100 * value / total)
    }

    private openingValueOf({ reading }: { reading: TopicReading }): number {
        return reading.measurements[0]?.startValue ?? 0
    }

    private closingValueOf({ reading, period }: {
        reading: TopicReading,
        period: Period | null
    }): number {
        if (period === null) return reading.valuation?.value ?? 0;

        const lastMeasurement = reading.measurements[reading.measurements.length - 1]
        return lastMeasurement?.endValue ?? 0
    }

    private resultOf({ reading, period }: {
        reading: TopicReading,
        period: Period | null
    }): number {
        if (period !== null) return this.aggregate({ measurements: reading.measurements }).result;

        const { deposits, withdrawals } = this.tallyMovements({ movements: reading.movements })

        return this.closingValueOf({ reading, period })
            - this.openingValueOf({ reading })
            - (deposits - withdrawals)
    }

    private inPeriod({ month, period }: { month: string, period: Period | null }): boolean {
        if (period === null) return true;
        return month >= period.from && month <= period.to
    }

    private scopeReading({ reading, period }: {
        reading: TopicReading,
        period: Period | null
    }): TopicReading {
        if (period === null) return reading;

        return {
            ...reading,
            measurements: reading.measurements.filter((measurement) => this.inPeriod({
                month: this.monthOf({ date: measurement.startDate }),
                period
            })),
            movements: reading.movements.filter((movement) => this.inPeriod({
                month: this.monthOf({ date: movement.date }),
                period
            })),
        }
    }

    private consolidateMeasurements({ readings }: { readings: TopicReading[] }): Measurement[] {
        const contributors = readings.filter((reading) => reading.measurements.length > 0)
        if (contributors.length === 0) return [];

        const indexed = contributors.map((reading) => new Map(
            reading.measurements.map((measurement) => [
                this.monthOf({ date: measurement.startDate }),
                measurement
            ])
        ))

        const openingDate = contributors
            .map((reading) => reading.measurements[0].startDate)
            .reduce((earliest, date) => date < earliest ? date : earliest)
        const closingDate = contributors
            .map((reading) => reading.measurements[reading.measurements.length - 1].endDate)
            .reduce((latest, date) => date > latest ? date : latest)

        const carriedValues = new Map<number, number>()
        const consolidated: Measurement[] = []

        for (const month of this.monthsBetween({ fromDate: openingDate, toDate: closingDate })) {
            const window = this.windowOf({ month, openingDate, closingDate })
            if (window === null) continue;

            let startValue = 0
            let endValue = 0
            let balance = 0
            let result = 0
            let capitalDays = 0
            let movements: TopicMovement[] = []

            indexed.forEach((measurements, index) => {
                const measurement = measurements.get(month)

                if (measurement === undefined) {
                    const carriedValue = carriedValues.get(index) ?? 0
                    startValue += carriedValue
                    endValue += carriedValue
                    return;
                }

                startValue += measurement.startValue
                endValue += measurement.endValue
                balance += measurement.balance
                result += measurement.result
                capitalDays += measurement.capitalDays
                movements = movements.concat(measurement.movements)

                carriedValues.set(index, measurement.endValue)
            })

            consolidated.push({
                ...window,
                startValue,
                endValue,
                balance,
                result,
                capitalDays,
                movements: movements.sort((left, right) => left.date.localeCompare(right.date)),
            })
        }

        return consolidated
    }

    private summarizeCashFlow({ movements }: { movements: TopicMovement[] }): WalletCashFlow[] {
        const byMonth = new Map<string, WalletCashFlow>()

        movements.forEach((movement) => {
            const month = this.monthOf({ date: movement.date })
            const entry = byMonth.get(month) ?? {
                month,
                deposits: 0,
                withdrawals: 0,
                balance: 0,
                movements: 0
            }

            if (movement.value >= 0) entry.deposits += movement.value
            else entry.withdrawals -= movement.value
            entry.balance += movement.value
            entry.movements += 1

            byMonth.set(month, entry)
        });

        return [...byMonth.values()]
            .sort((left, right) => left.month.localeCompare(right.month))
            .map((entry) => ({
                month: entry.month,
                deposits: this.round(entry.deposits),
                withdrawals: this.round(entry.withdrawals),
                balance: this.round(entry.balance),
                movements: entry.movements,
            }))
    }

    private buildCalendar({ measurements, readings }: {
        measurements: Measurement[],
        readings: TopicReading[]
    }): WalletCalendarMonth[] {
        const calendar = new Map<string, WalletCalendarMonth>()

        const entryOf = (month: string): WalletCalendarMonth => {
            const existing = calendar.get(month)
            if (existing !== undefined) return existing;

            const created: WalletCalendarMonth = {
                month,
                result: 0,
                movements: 0,
                measured: false
            }
            calendar.set(month, created)
            return created
        }

        measurements.forEach((measurement) => {
            const entry = entryOf(this.monthOf({ date: measurement.startDate }))
            entry.result = this.round(measurement.result)
            entry.measured = true
        })

        readings.forEach((reading) => reading.movements.forEach((movement) => {
            entryOf(this.monthOf({ date: movement.date })).movements += 1
        }))

        return [...calendar.values()].sort((left, right) => left.month.localeCompare(right.month))
    }

    private toSlice({ readings, period }: {
        readings: TopicReading[],
        period: Period | null
    }): WalletSlice {
        const measurements = this.consolidateMeasurements({ readings })
        const aggregate = this.aggregate({ measurements })

        const movements = readings.flatMap((reading) => reading.movements)
        const { deposits, withdrawals } = this.tallyMovements({ movements })
        const investedCapital = deposits - withdrawals

        const openingValue = measurements[0]?.startValue ?? 0

        const currentValue = readings.reduce(
            (acc, reading) => acc + this.closingValueOf({ reading, period }),
            0
        )
        const result = readings.reduce(
            (acc, reading) => acc + this.resultOf({ reading, period }),
            0
        )

        return {
            topics: readings.length,
            openingValue: this.round(openingValue),
            currentValue: this.round(currentValue),
            deposits: this.round(deposits),
            withdrawals: this.round(withdrawals),
            investedCapital: this.round(investedCapital),
            result: this.round(result),
            totalDays: aggregate.totalDays,
            capitalDays: this.round(aggregate.capitalDays),
            performance: aggregate.performance,
            months: measurements.map((measurement) => this.toMonthlySummary({ measurement })),
            cashFlow: this.summarizeCashFlow({ movements }),
        }
    }

    private toPosition({ reading, walletValue, period }: {
        reading: TopicReading,
        walletValue: number,
        period: Period | null
    }): WalletPosition {
        const aggregate = this.aggregate({ measurements: reading.measurements })
        const { deposits, withdrawals } = this.tallyMovements({ movements: reading.movements })

        const lastMeasurement = reading.measurements[reading.measurements.length - 1]
        const currentValue = this.closingValueOf({ reading, period })

        return {
            id: reading.topic.id,
            name: reading.topic.name,
            type: reading.topic.type,
            currentValue: this.round(currentValue),
            currentAmount: reading.valuation?.amount ?? null,
            mostRecentDate: period === null
                ? reading.valuation?.date ?? null
                : lastMeasurement?.endDate ?? null,
            deposits: this.round(deposits),
            withdrawals: this.round(withdrawals),
            investedCapital: this.round(deposits - withdrawals),
            result: this.round(this.resultOf({ reading, period })),
            totalDays: aggregate.totalDays,
            capitalDays: this.round(aggregate.capitalDays),
            performance: aggregate.performance,
            share: this.shareOf({ value: currentValue, total: walletValue }),
        }
    }

    private toWalletMovements({ readings }: { readings: TopicReading[] }): WalletMovement[] {
        return readings
            .flatMap((reading) => reading.movements.map((movement) => ({
                topicId: reading.topic.id,
                topicName: reading.topic.name,
                topicType: reading.topic.type,
                date: movement.date,
                value: movement.value,
            })))
            .sort((left, right) => left.date.localeCompare(right.date))
    }

    private toSegments({ readings, period, walletValue }: {
        readings: TopicReading[],
        period: Period | null,
        walletValue: number
    }): WalletSegment[] {
        return Object.values(TopicType)
            .map((type) => ({
                type,
                readings: readings.filter((reading) => reading.topic.type === type)
            }))
            .filter((segment) => segment.readings.length > 0)
            .map((segment) => {
                const slice = this.toSlice({ readings: segment.readings, period })

                return {
                    ...slice,
                    type: segment.type,
                    share: this.shareOf({ value: slice.currentValue, total: walletValue }),
                }
            })
    }

    async consolidate({ topics, period }: {
        topics: Topic[],
        period: Period | null
    }): Promise<Wallet> {
        const history: TopicReading[] = []
        for (const topic of topics) history.push(await this.read({ topic }))

        const calendar = this.buildCalendar({
            measurements: this.consolidateMeasurements({ readings: history }),
            readings: history,
        })

        const readings = history.map((reading) => this.scopeReading({ reading, period }))
        const wallet = this.toSlice({ readings, period })

        return {
            ...wallet,
            segments: this.toSegments({ readings, period, walletValue: wallet.currentValue }),
            positions: readings
                .map((reading) => this.toPosition({
                    reading,
                    walletValue: wallet.currentValue,
                    period
                }))
                .sort((left, right) => right.currentValue - left.currentValue),
            movements: this.toWalletMovements({ readings }),
            calendar,
        }
    }
}
