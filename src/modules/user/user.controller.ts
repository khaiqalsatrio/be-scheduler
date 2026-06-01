import { Body, Controller, Get, Patch, Post, Put, Delete, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UserService } from './user.service';

@ApiBearerAuth('access-token')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@User('userId') userId: string) {
    return this.userService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getAllUsers(@User('userId') userId: string) {
    return this.userService.findAllUsers(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@User('userId') userId: string, @Body() dto: UpdateUserDto) {
    return this.userService.updateUser(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/avatars',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `${(req as any).user.userId}-${uniqueSuffix}${ext}`);
      },
    }),
  }))
  uploadAvatar(@User('userId') userId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.userService.updateAvatar(userId, avatarUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/avatar')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/avatars',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `${(req as any).user.userId}-${uniqueSuffix}${ext}`);
      },
    }),
  }))
  updateAvatar(@User('userId') userId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.userService.updateAvatar(userId, avatarUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/avatar')
  deleteAvatar(@User('userId') userId: string) {
    return this.userService.deleteAvatar(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/password')
  updatePassword(@User('userId') userId: string, @Body() dto: UpdatePasswordDto) {
    return this.userService.updatePassword(userId, dto);
  }
}
