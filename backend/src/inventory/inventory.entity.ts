import {
    Entity,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('inventory')
export class Inventory {
    @Column({ primary: true, type: 'uuid', default: () => 'gen_random_uuid()' })
    id: string;

    @Column({ name: 'itemName' })
    itemName: string;

    @Column()
    category: string;

    @Column({ type: 'int', default: 0 })
    quantity: number;

    @Column({ nullable: true })
    unit: string;

    @Column({ name: 'minStock', type: 'int', default: 0 })
    minStock: number;

    @Column({ nullable: true })
    location: string;

    @Column({ nullable: true })
    description: string;

    @CreateDateColumn({ name: 'createdAt' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt' })
    updatedAt: Date;
}
