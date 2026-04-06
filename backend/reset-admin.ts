import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { UsersService } from './src/users/users.service';

async function resetPassword() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);

    const adminEmail = 'admin@otec.com';
    const existingAdmin = await usersService.findByEmail(adminEmail);

    if (existingAdmin) {
        console.log(`Resetting password for ${adminEmail}...`);
        await usersService.update(existingAdmin.id, { password: 'admin123!' });
        console.log('Password successfully reset to: admin123!');
    } else {
        console.log('Admin user not found!');
    }

    await app.close();
}

resetPassword().catch((err) => {
    console.error(err);
    process.exit(1);
});
