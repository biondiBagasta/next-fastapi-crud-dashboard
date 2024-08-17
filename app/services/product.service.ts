import { defer, map, Observable } from "rxjs";
import { Paginate } from "../interfaces/paginate";
import { Product } from "../interfaces/product";
import { axiosClientSecuredJsonContent, baseUrl } from "../utils/utils";
import { ResponseQuery } from "../interfaces/response-query";
import { FileResponse } from "../interfaces/file-response";

interface ProductPaginate {
	data: Product[];
	paginate: Paginate;
}

interface ProductBody {
	code: string;
	name: string;
	purchase_price: number;
	selling_price: number;
	stock: number;
	discount: number;
	image: string;
	category_id: number;
}

export class ProductService {

	searchPaginate(term: string, page: number): Observable<ProductPaginate> {

		const jwt = localStorage.getItem("jwt") ?? "";

		return defer(() => {
			return axiosClientSecuredJsonContent(jwt).get<ProductPaginate>(`${baseUrl}/product/search/?page=${page}&term=${term}`);
		}).pipe(
			map(response => {
				return response.data;
			})
		)
	}

	create(body: ProductBody): Observable<ResponseQuery> {

		const jwt = localStorage.getItem("jwt") ?? "";

		return defer(() => {
			return axiosClientSecuredJsonContent(jwt).post<ResponseQuery>(
				`${baseUrl}/product`, body
			)
		}).pipe(
			map(response => {
				return response.data
			})
		);
	}

	update(id: number, body: ProductBody): Observable<ResponseQuery> {
		const jwt = localStorage.getItem("jwt") ?? "";

		return defer(() => {
			return axiosClientSecuredJsonContent(jwt).put<ResponseQuery>(
				`${baseUrl}/product/${id}`, body
			)
		}).pipe(
			map(response => {
				return response.data;
			})
		)
	}

	delete(id: number): Observable<ResponseQuery> {
		const jwt = localStorage.getItem("jwt") ?? "";

		return defer(() => {
			return axiosClientSecuredJsonContent(jwt).delete<ResponseQuery>(
				`${baseUrl}/product/${id}`
			)
		}).pipe(
			map(response => {
				return response.data;
			})
		)
	}

	uploadProductImage(data: FormData): Observable<FileResponse> {
		const jwt = localStorage.getItem("jwt") ?? "";

		return defer(() => {
			return axiosClientSecuredJsonContent(jwt).post<FileResponse>(
				`${baseUrl}/files/product`, data, {
					headers: {
						"Content-Type": "multipart/form-data"
					}
				}
			)
		}).pipe(
			map(response => {
				return response.data;
			})
		)
	}

	deleteProductImage(filename: string): Observable<void> {
		const jwt = localStorage.getItem("jwt") ?? "";

		return defer(() => {
			return axiosClientSecuredJsonContent(jwt).delete<void>(
				`${baseUrl}/files/product/${filename}`
			)
		}).pipe(
			map(response => response.data)
		)
	}
}