import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { Role } from '../roles/role.entity';
import { AuditService } from '../common/audit/audit.service';
import * as bcrypt from 'bcryptjs';

type Repo<T> = {
  find: jest.Mock;
  findOne: jest.Mock;
  findBy: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  increment: jest.Mock;
};

function makeRepo<T>(): Repo<T> {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findBy: jest.fn(),
    create: jest.fn((x) => ({ ...x })),
    save: jest.fn(async (x) => ({ id: 'u1', ...x })),
    update: jest.fn(),
    delete: jest.fn(),
    increment: jest.fn(),
  };
}

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: Repo<User>;
  let roleRepo: Repo<Role>;
  let audit: { record: jest.Mock };

  beforeEach(async () => {
    userRepo = makeRepo<User>();
    roleRepo = makeRepo<Role>();
    audit = { record: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Role), useValue: roleRepo },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('rejects duplicate email with ConflictException', async () => {
      userRepo.findOne.mockResolvedValueOnce({ id: 'existing', email: 'a@b.com' });

      await expect(
        service.create({ email: 'A@B.com', password: 'pw12345!', firstName: 'A', lastName: 'B' } as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('normalizes email, hashes password, and strips secrets from response', async () => {
      userRepo.findOne.mockResolvedValueOnce(null);
      roleRepo.findOne.mockResolvedValueOnce({ id: 'r1', name: 'user' });
      userRepo.save.mockImplementationOnce(async (u) => ({ id: 'u1', ...u, resetPasswordToken: 't' }));

      const result: any = await service.create({
        email: '  Mixed@Case.COM ',
        password: 'pw12345!',
        firstName: 'A',
        lastName: 'B',
      } as any);

      expect(userRepo.save).toHaveBeenCalled();
      const saved = userRepo.save.mock.calls[0][0];
      expect(saved.email).toBe('mixed@case.com');
      expect(saved.password).not.toBe('pw12345!');
      expect(await bcrypt.compare('pw12345!', saved.password)).toBe(true);

      expect(result.password).toBeUndefined();
      expect(result.resetPasswordToken).toBeUndefined();
      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.create' }));
    });
  });

  describe('changePassword', () => {
    it('rejects wrong current password', async () => {
      const hash = await bcrypt.hash('correct', 10);
      userRepo.findOne.mockResolvedValueOnce({ id: 'u1', password: hash, tokenVersion: 0 });

      await expect(service.changePassword('u1', 'wrong', 'newpass12'))
        .rejects.toBeInstanceOf(BadRequestException);
      expect(userRepo.save).not.toHaveBeenCalled();
    });

    it('rotates token version on success', async () => {
      const hash = await bcrypt.hash('correct', 10);
      userRepo.findOne.mockResolvedValueOnce({ id: 'u1', email: 'a@b.com', password: hash, tokenVersion: 3 });

      await service.changePassword('u1', 'correct', 'newpass12');

      const saved = userRepo.save.mock.calls[0][0];
      expect(saved.tokenVersion).toBe(4);
      expect(saved.password).not.toBe(hash);
      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.password.change' }));
    });
  });

  describe('remove (soft delete)', () => {
    it('marks the user inactive and bumps tokenVersion', async () => {
      userRepo.findOne.mockResolvedValueOnce({ id: 'u1', email: 'a@b.com', isActive: true, tokenVersion: 0, roles: [] });

      await service.remove('u1');

      const saved = userRepo.save.mock.calls[0][0];
      expect(saved.isActive).toBe(false);
      expect(saved.tokenVersion).toBe(1);
      expect(userRepo.delete).not.toHaveBeenCalled();
      expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'user.deactivate' }));
    });

    it('throws NotFoundException when user missing', async () => {
      userRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
