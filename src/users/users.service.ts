import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/users.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 사용자 찾기
  async findeOne(username: string): Promise<User | undefined> {
    return this.userRepository.findOne({
      where: { username },
      relations: ['refreshTokens'],
    });
  }

  // 새로운 사용자 생성
  async createUser(
    username: string,
    password: string,
    role: string = 'user',
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      role,
    });
    return this.userRepository.save(user);
  }
}
