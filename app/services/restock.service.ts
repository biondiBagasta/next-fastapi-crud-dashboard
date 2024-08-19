import { defer, map, Observable } from "rxjs";
import { Paginate } from "../interfaces/paginate";
import { Restock } from "../interfaces/restock";
import { axiosClientSecuredJsonContent } from "../utils/utils";
import { ResponseQuery } from "../interfaces/response-query";

interface RestockPaginate {
	data: Restock[];
	paginate: Paginate;
}

interface RestockBody {
	restock_date: Date;
	detail: string;
	amount: number;
}

export class RestockService {

	paginate(page: number): Observable<RestockPaginate> {
		const jwt = localStorage.getItem("jwt") ?? "";

		return defer(() => {
			return axiosClientSecuredJsonContent(jwt).get<RestockPaginate>(`/restock/paginate/?page=${page}`)
		}).pipe(
			map(response => {
				return response.data
			})
		)
	}

	filterByDate(page: number, startDate: Date, endDate: Date): Observable<RestockPaginate> {
		const jwt = localStorage.getItem("jwt") ?? "";

		return defer(() => {
			return axiosClientSecuredJsonContent(jwt).post<RestockPaginate>(`/restock/filter-by-date`, {
				page: page,
				start_date: startDate,
				end_date: endDate
			})
		}).pipe(
			map((response) => {
				return response.data
			})
		)
	}

	create(body: RestockBody): Observable<ResponseQuery> {
		const jwt = localStorage.getItem("jwt") ?? "";

		return defer(() => {
			return axiosClientSecuredJsonContent(jwt).post<ResponseQuery>(`/restock`, body)
		}).pipe(
			map(response => response.data)
		)
	}

	update(id: number, body: RestockBody): Observable<ResponseQuery> {
		const jwt = localStorage.getItem("jwt") ?? "";

		return defer(() => {
			return axiosClientSecuredJsonContent(jwt).put<ResponseQuery>(`/restock/${id}`, body)
		}).pipe(
			map(response => response.data)
		)
	}

	delete(id: number): Observable<ResponseQuery> {
		const jwt = localStorage.getItem("jwt") ?? "";

		return defer(() => {
			return axiosClientSecuredJsonContent(jwt).delete<ResponseQuery>(`/restock/${id}`)
		}).pipe(
			map(response => response.data)
		)
	}
}