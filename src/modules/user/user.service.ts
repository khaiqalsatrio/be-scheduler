import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(partial: Partial<User>): Promise<User> {
    const user = this.userRepository.create({
      ...partial,
      email: partial.email?.toLowerCase() ?? '',
    });
    return await this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async findById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async getProfile(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { password, ...result } = user;
    return result;
  }

  async findAllUsers(currentUserId: string): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.find({
      where: { id: Not(currentUserId) },
    });
    return users.map((user) => {
      const { password, ...result } = user;
      return result;
    });
  }

  async updateUser(
    id: string,
    dto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (dto.email) {
      user.email = dto.email.toLowerCase();
    }
    if (dto.name) user.name = dto.name;
    if (dto.username) user.username = dto.username;
    if (dto.company !== undefined) user.company = dto.company;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.nik !== undefined) user.nik = dto.nik;
    if (dto.avatar !== undefined) user.avatar = dto.avatar;
    if (dto.position !== undefined) user.position = dto.position;
    user.updatedAt = new Date();
    user.lastActiveAt = new Date();
    const updated = await this.userRepository.save(user);
    const { password: _, ...result } = updated;
    return result;
  }

  async setOnboarded(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isOnboarded = true;
    user.updatedAt = new Date();
    const updated = await this.userRepository.save(user);
    const { password: _, ...result } = updated;
    return result;
  }
}
