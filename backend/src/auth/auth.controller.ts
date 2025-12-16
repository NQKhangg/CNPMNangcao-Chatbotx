import {
  Body,
  Controller,
  Post,
  Put,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dtos/signup.dto';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { AuthenticationGuard } from 'src/guards/authentication.guard';
import { AuditInterceptor } from 'src/common/interceptors/audit.interceptor'; // Import Audit
import { Audit } from 'src/common/decorators/audit.decorator';
import { Action } from 'src/roles/enums/action.enum';
import { Resource } from 'src/roles/enums/resource.enum';

@Controller('auth')
@UseInterceptors(AuditInterceptor)
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Đăng ký tài khoản mới (Customer)
   * Public API
   */
  @Post('signup')
  @Audit(Resource.users, Action.create)
  async signup(@Body() signUpDto: SignUpDto) {
    return this.authService.signup(signUpDto);
  }

  /**
   * Đăng nhập hệ thống
   * Public API
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Cấp lại AccessToken mới bằng RefreshToken
   * Public API
   */
  @Post('refresh')
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  /**
   * Đổi mật khẩu
   * Private API (Cần đăng nhập)
   */
  @UseGuards(AuthenticationGuard)
  @Put('change-password')
  @Audit(Resource.users, Action.update)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req,
  ) {
    return this.authService.changePassword(
      req.userId,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
  }

  /**
   * Quên mật khẩu - Gửi email reset
   * Public API
   */
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  /**
   * Đặt lại mật khẩu mới (kèm token từ email)
   * Public API
   */
  @Put('reset-password')
  @Audit(Resource.users, Action.update)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.newPassword,
      resetPasswordDto.resetToken,
    );
  }

  @Post('google')
  async googleLogin(@Body('token') token: string) {
    return this.authService.loginWithGoogle(token);
  }
}
