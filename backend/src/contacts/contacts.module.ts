import { Module } from '@nestjs/common';
import { ContactService } from './contacts.service';
import { ContactController } from './contacts.controller';
import { MailModule } from 'src/mail/mail.module';
import { UsersModule } from 'src/users/users.module';
import { Contact, ContactSchema } from './entities/contacts.entity';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Contact.name, schema: ContactSchema }]),
    MailModule,
    UsersModule,
  ],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
