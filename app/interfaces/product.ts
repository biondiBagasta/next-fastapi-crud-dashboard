import { Category } from "./category";

export interface Product {
	id: number;
	code: string;
	name: string;
	purchase_price: number;
	selling_price: number;
	stock: number;
	discount: number;
	image: string;
	category_id: number;
	category?: Category;
	created_at: Date;
	updated_at: Date;
}