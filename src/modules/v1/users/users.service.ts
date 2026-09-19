import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./users.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>

  ) {}

  searchAll() {
    return this.repository.find(
      { order: { createdAt: "DESC" } }
    );
  }

  async find({ id }: { id: string }) {
    const user = await this.repository.findOneBy({ id });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  searchByEmail({ email }: { email: string }) {
    return this.repository.findOneBy({ email });
  }

  async upsert({ email, name }: { email: string; name: string }): Promise<User> {
    const currentUser = await this.searchByEmail({ email });

    if (currentUser) {
      currentUser.name = name ?? currentUser.name;
      return this.repository.save(currentUser);
    }

    const user = this.repository.create({ email, name });
    return this.repository.save(user);
  }

  async delete({ id }: { id: string }) {
    await this.find({ id });
    return this.repository.delete({ id });
  }
}
