import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { SignUpDto } from './dtos/signup.dto';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from './entities/refresh-token.entity';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';
import { ResetToken } from './entities/reset-token.entity';
import { MailService } from '../mail/mail.service';
import { RolesService } from 'src/roles/roles.service';
import { UsersService } from 'src/users/users.service';
import { OAuth2Client } from 'google-auth-library';
import { User, UserDocument } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  constructor(
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshToken>,
    @InjectModel(ResetToken.name) private resetTokenModel: Model<ResetToken>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private mailService: MailService,
    private rolesService: RolesService,
    private usersService: UsersService,
  ) {}

  /**
   * Xử lý đăng ký tài khoản khách hàng
   * 1. Check email trùng
   * 2. Hash password
   * 3. Tạo user với role Customer
   * 4. Trả về token đăng nhập
   */
  async signup(signUpDto: SignUpDto) {
    const { name, email, password } = signUpDto;

    // 1. Kiểm tra Email tồn tại
    const exists = await this.usersService.findByEmail(email);
    if (exists) throw new BadRequestException('Email đã tồn tại');

    // 2. Hash mật khẩu (Salt round = 10)
    const hashPassword = await bcrypt.hash(password, 10);

    // 3. Tạo User (Mặc định Role Customer)
    const newUser = await this.usersService.createCustomer({
      name,
      email,
      password: hashPassword,
    });

    // 4. Lấy Role Name để tạo Token
    // createCustomer trả về user, ta cần đảm bảo lấy đúng role name
    // Nếu populate chưa có, query lại user kèm populate role
    const userWithRole = await this.usersService.findById(
      newUser._id.toString(),
    );
    const roleName = (userWithRole?.roleId as any)?.name || 'Customer';

    // 5. Generate Token
    const tokens = await this.generateUserTokens(
      newUser._id.toString(),
      newUser.email,
      roleName,
    );

    // Trả về kèm thông tin user (để Interceptor log lại _id)
    return {
      ...tokens,
      _id: newUser._id, // Cho Audit Log
      user: { name: newUser.name, email: newUser.email, role: roleName },
    };
  }

  /**
   * Xử lý đăng nhập
   * 1. Tìm user theo email
   * 2. Check active
   * 3. So khớp password
   * 4. Trả token
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);

    // Bảo mật: Thông báo chung chung để tránh dò user
    if (!user) throw new BadRequestException('Email hoặc mật khẩu không đúng');

    if (!user.isActive)
      throw new BadRequestException('Tài khoản của bạn đã bị khóa');

    const passMatches = await bcrypt.compare(password, user.password);
    if (!passMatches)
      throw new BadRequestException('Email hoặc mật khẩu không đúng');

    // Lấy Role Name
    let roleName = 'Unknown';
    if (user.roleId && typeof user.roleId === 'object') {
      roleName = (user.roleId as any).name;
    } else if (user.roleId) {
      // Fallback nếu populate lỗi
      const role = await this.rolesService.getRoleById(user.roleId);
      roleName = role?.name || 'Unknown';
    }

    const tokens = await this.generateUserTokens(
      user._id.toString(),
      user.email,
      roleName,
    );

    return {
      ...tokens,
      _id: user._id, // Thêm _id để AuditInterceptor bắt được
      userId: user._id, // Giữ lại field cũ cho frontend (nếu frontend đang dùng)
      role: roleName,
      name: user.name,
      avatar: user.avatar,
    };
  }

  /**
   * Lưu Refresh Token vào DB
   * token Chuỗi token
   * userId ID người dùng
   */
  async storeRefreshToken(token: string, userId: string) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // Hết hạn sau 7 ngày

    // Upsert: Nếu có rồi thì update, chưa có thì tạo mới
    await this.refreshTokenModel.updateOne(
      { userId },
      { $set: { expiryDate, token } },
      { upsert: true },
    );
  }

  /**
   * Cấp lại Access Token mới
   */
  async refreshTokens(refreshToken: string) {
    const tokenEntry = await this.refreshTokenModel.findOne({
      token: refreshToken,
      expiryDate: { $gte: new Date() }, // Còn hạn
    });

    if (!tokenEntry) {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }

    const user = await this.usersService.findById(tokenEntry.userId.toString());
    if (!user) throw new UnauthorizedException('User not found');

    const roleName = (user?.roleId as any)?.name || 'Unknown';

    return this.generateUserTokens(user._id.toString(), user.email, roleName);
  }

  /**
   * Helper tạo cặp Access/Refresh Token
   */
  async generateUserTokens(userId: string, email: string, role: string) {
    const accessToken = this.jwtService.sign(
      { userId, email, role },
      { expiresIn: '1d' }, // Access token sống 1 ngày
    );

    const refreshToken = uuidv4();
    await this.storeRefreshToken(refreshToken, userId);

    return {
      accessToken,
      refreshToken,
    };
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.userModel.findById(userId).select('+password');

    if (!user) throw new BadRequestException('User not found');

    if (!user.password) {
      throw new BadRequestException(
        'Tài khoản đăng nhập bằng Google không thể đổi mật khẩu.',
      );
    }

    // Xác thực mật khẩu cũ
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new BadRequestException('Mật khẩu cũ không đúng');
    }

    // Hash mật khẩu mới và lưu
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    return {
      message: 'Đổi mật khẩu thành công',
      oldData: { _id: userId, oldPassword: oldPassword },
      newData: { _id: userId, newPassword: hashedNewPassword },
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user)
      throw new BadRequestException('Email không tồn tại trong hệ thống');

    // Tạo token reset ngẫu nhiên (nanoid 64 ký tự)
    const expireDate = new Date();
    expireDate.setHours(expireDate.getHours() + 1); // Hết hạn sau 1 giờ

    const resetToken = nanoid(64);

    // Lưu vào DB reset_tokens
    await this.resetTokenModel.create({
      token: resetToken,
      userId: user._id,
      expiryDate: expireDate,
    });

    // Gửi email
    this.mailService.sendPasswordResetEmail(email, resetToken);

    return { message: 'Link đặt lại mật khẩu đã được gửi vào email của bạn' };
  }

  async resetPassword(newPassword: string, resetToken: string) {
    // Tìm token và xóa luôn (One-time use) - Đảm bảo token chỉ dùng được 1 lần
    const tokenEntry = await this.resetTokenModel.findOneAndDelete({
      token: resetToken,
      expiryDate: { $gte: new Date() }, // Còn hạn
    });

    if (!tokenEntry) {
      throw new BadRequestException(
        'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
      );
    }

    const user = await this.usersService.findById(tokenEntry.userId.toString());
    if (!user) throw new BadRequestException('User not found');

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    return {
      message: 'Đặt lại mật khẩu thành công',
      oldData: null,
      newData: { _id: user._id, newPassword: hashedNewPassword },
    };
  }

  // --- HÀM XỬ LÝ GOOGLE LOGIN ---
  async loginWithGoogle(token: string) {
    // 1. Xác thực token với Google
    const ticket = await this.googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload) throw new BadRequestException('Token Google không hợp lệ');

    const { email, name, picture, sub: googleId } = payload;
    console.log(payload);
    const _email =
      email?.toString() || `${name?.trim().toLowerCase()}@gmail.com`;

    // 2. Tìm xem user đã tồn tại chưa
    let user = await this.usersService.findByEmail(_email);

    if (user) {
      // Nếu user đã tồn tại nhưng chưa có googleId (đăng ký thường), cập nhật thêm
      if (!user.googleId) {
        user.googleId = googleId;
        // user.avatar = _avatar; // Cập nhật avatar nếu chưa có
        user.authType = 'google'; // Hoặc cả 2
        await user.save();
      }
    } else {
      // 3. Nếu chưa có -> Tạo User mới
      // Lấy Role Customer mặc định (Bạn cần code hàm getRoleByName hoặc hardcode ID)
      const customerRole = await this.rolesService.getRoleByName('Customer');

      const newUser = {
        email,
        name,
        avatar: picture,
        googleId,
        roleId: customerRole?._id,
        authType: 'google',
        password: '', // Không cần pass
        isActive: true,
      };
      user = await this.usersService.createCustomer(newUser);
    }

    // 4. Tạo JWT Token trả về (Giống hàm login thường)
    const payloadJwt = {
      userId: user._id,
      email: user.email,
      role: user.roleId,
    };
    return {
      access_token: this.jwtService.sign(payloadJwt),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.roleId,
      },
    };
  }
}
