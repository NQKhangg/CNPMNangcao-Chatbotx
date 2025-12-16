import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/entities/user.entity';
import {
  RefreshToken,
  RefreshTokenSchema,
} from './entities/refresh-token.entity';
import { ResetToken, ResetTokenSchema } from './entities/reset-token.entity';
import { MailService } from '../mail/mail.service';
import { RolesModule } from 'src/roles/roles.module';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    UsersModule,
    RolesModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: ResetToken.name, schema: ResetTokenSchema },
    ]),
    PassportModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, MailService],
  exports: [AuthService],
})
export class AuthModule {}
