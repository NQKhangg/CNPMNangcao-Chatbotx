import { Injectable, NotFoundException } from '@nestjs/common';
import { MailService } from 'src/mail/mail.service';
import { InjectModel } from '@nestjs/mongoose';
import { Contact, ContactDocument } from './entities/contacts.entity';
import { isValidObjectId, Model } from 'mongoose';
import { CreateContactDto } from './dtos/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectModel(Contact.name) private contactModel: Model<ContactDocument>,
    private mailService: MailService, // Inject service gửi mail
  ) {}

  /**
   * Lưu tin nhắn liên hệ vào Database
   * createContactDto dữ liệu từ form (dto)
   * userId ID người gửi (nếu đã đăng nhập), có thể null
   */
  async create(createContactDto: CreateContactDto, userId: string) {
    return this.contactModel.create({
      ...createContactDto,
      customerId: userId, // Liên kết với user nếu có
    });
  }

  /**
   * Lấy danh sách contact có phân trang và tìm kiếm
   */
  async findAll(page: number, limit: number, keyword: string) {
    // 1. Tính toán vị trí bắt đầu (Pagination Logic)
    const skip = (page - 1) * limit;

    // 2. Xây dựng bộ lọc (Dynamic Filter)
    const filter: any = {};

    if (keyword && keyword.trim() !== '') {
      // Tạo Regex: 'i' nghĩa là không phân biệt hoa thường (Case-insensitive)
      const regex = new RegExp(keyword.trim(), 'i');

      // Tìm kiếm trên nhiều trường Text cùng lúc ($or)
      const orQuery: any[] = [
        { name: regex }, // Tên khách
        { email: regex }, // Email khách
        { subject: regex }, // Tiêu đề
        { message: regex }, // Nội dung
        { status: regex }, // Trạng thái
      ];

      // Nếu keyword là 1 ObjectId hợp lệ -> Tìm chính xác theo ID
      if (isValidObjectId(keyword)) {
        orQuery.push({ _id: keyword }); // Tìm theo ID tin nhắn
        orQuery.push({ customerId: keyword }); // Tìm theo ID người gửi
      }

      filter.$or = orQuery;
    }

    // 3. Thực thi Query song song (Promise.all) để tối ưu hiệu năng
    // Query 1: Lấy dữ liệu (Data)
    // Query 2: Đếm tổng số bản ghi (Total)
    const [data, total] = await Promise.all([
      this.contactModel
        .find(filter)
        .populate('customerId', 'name email phone') // Lấy thông tin người gửi
        .populate('replierId', 'name email') // Lấy thông tin admin trả lời
        .sort({ createdAt: -1, _id: -1 }) // Sắp xếp mới nhất trước
        .skip(skip)
        .limit(limit)
        .exec(),
      this.contactModel.countDocuments(filter),
    ]);

    // 4. Trả về format chuẩn cho Frontend
    return {
      data,
      total,
      page: page,
      lastPage: Math.ceil(total / limit),
    };
  }

  /**
   * Xử lý trả lời tin nhắn
   * 1. Tìm tin nhắn gốc
   * 2. Gửi Email cho khách
   * 3. Cập nhật trạng thái DB
   */
  async reply(id: string, replyContent: string, userId: string) {
    const contact = await this.contactModel.findById(id);
    if (!contact)
      throw new NotFoundException('Không tìm thấy tin nhắn liên hệ');

    // Bước 1: Gửi mail (Quan trọng: Nếu gửi mail lỗi thì có nên update DB không?
    // Ở đây ta await, nếu lỗi sẽ throw exception và dừng luôn, không update DB -> An toàn)
    await this.mailService.sendContactReply(
      contact.email,
      contact.name,
      contact.message, // Nội dung khách hỏi
      replyContent, // Nội dung admin trả lời
    );

    // Bước 2: Cập nhật thông tin vào Database
    contact.status = 'REPLIED'; // Đổi trạng thái
    contact.replyMessage = replyContent;
    contact.repliedAt = new Date();
    contact.replierId = userId; // Lưu ID Admin đã trả lời

    await contact.save();

    return {
      oldData: null,
      newData: contact,
    };
  }
}
