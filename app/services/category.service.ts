import { defer, map, Observable } from "rxjs";
import { Category } from "../interfaces/category";
import { Paginate } from "../interfaces/paginate";
import { axiosClientSecuredJsonContent } from "../utils/utils";
import { ResponseQuery } from "../interfaces/response-query";

interface CategoryPaginate {
	data: Category[];
	paginate: Paginate;
}

interface CategoryBody {
	name: string;
}

export class CategoryService {

	findMany(): Observable<Category[]> {
		const jwt = localStorage.getItem("jwt") ?? "";

		return defer(() => {
			return axiosClientSecuredJsonContent(jwt).get<Category[]>(`/category/many`)
		}).pipe(
			map(response => {
				return response.data;
			})
		)
	}

	searchPaginate(term: string, page: number): Observable<CategoryPaginate> {

		const jwt = localStorage.getItem("jwt") ?? "";

		return defer(() => {
			return axiosClientSecuredJsonContent(jwt).get<CategoryPaginate>(`/category/search/?page=${page}&term=${term}`)
		}).pipe(
			map(response => {
				return response.data;

			})
		)
	}

	create(body: CategoryBody): Observable<ResponseQuery> {

		const jwt = localStorage.getItem("jwt") ?? "";

		return defer(() => {
			return axiosClientSecuredJsonContent(jwt).post<ResponseQuery>(`/category`, body)
		}).pipe(
			map(response => response.data)
		)
	}

	update(id: number, body: CategoryBody): Observable<ResponseQuery> {

		const jwt = localStorage.getItem("jwt") ?? "";

		return defer(() => {
			return axiosClientSecuredJsonContent(jwt).put(`/category/${id}`, body)
		}).pipe(
			map(response => response.data)
		)
	}

	delete(id: number): Observable<ResponseQuery> {

		const jwt = localStorage.getItem("jwt") ?? "";

		return defer(() => {
			return axiosClientSecuredJsonContent(jwt).delete(`/category/${id}`)
		}).pipe(
			map(response => response.data)
		)
	}
}