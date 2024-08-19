export interface RestockDetail {
	supplier: string;
	products: RestockDetailProduct[];
}

export interface RestockDetailProduct {
	name: string;
	purchase_price: number;
	qty: number;
}