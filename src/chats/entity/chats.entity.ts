import { BaseModel } from 'src/common/entity/base.entity';
import { UsersModel } from 'src/users/entities/users.entity';
import { Entity, ManyToMany } from 'typeorm';

@Entity()
export class ChatsModel extends BaseModel {
  @ManyToMany(() => UsersModel, (users) => users.chats)
  users: UsersModel[];
}
