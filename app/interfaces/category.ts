import { Product } from "./product";

export interface Category {
	id: number;
	name: string;
	created_at: Date;
	updated_at: Date;
	products: Product[];
}