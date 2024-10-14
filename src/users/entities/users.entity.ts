import { RefreshToken } from 'src/refresh_token/entities/refresh_token.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ default: 'user' })
  role: string; // user, admin

  @OneToMany(() => RefreshToken, (RefreshToken) => RefreshToken.user)
  refreshTokens: RefreshToken[];
}
