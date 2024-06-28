import { PassportSerializer } from '@nestjs/passport';
import { ActiveUserData } from 'src/iam/interfaces/active-user-data.interface';
import { User } from 'src/users/entities/user.entity';

export type doneFunctionTyping = (err: Error, user: ActiveUserData) => void;

export class UserSerializer extends PassportSerializer {
  serializeUser(user: User, done: doneFunctionTyping) {
    done(null, {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    });
  }
  deserializeUser(payload: ActiveUserData, done: doneFunctionTyping) {
    done(null, payload);
  }
}
