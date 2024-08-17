import { defer, map, Observable } from "rxjs";
import { Supplier } from "../interfaces/supplier";
import { Paginate } from "../interfaces/paginate";
import { axiosClientSecuredJsonContent, baseUrl } from "../utils/utils";
import { ResponseQuery } from "../interfaces/response-query";

interface SupplierPaginate {
	data: Supplier[];
	paginate: Paginate;
}

interface SupplierBody {
	name: string;
	address: string;
	phone_number: string;
}

export class SupplierService {

	searchPaginate(term: string, page: number): Observable<SupplierPaginate> {

		const jwt = localStorage.getItem("jwt") ?? "";

		return defer(() => {
			return axiosClientSecuredJsonContent(jwt).get<SupplierPaginate>(
				`/supplier/search/?page=${page}&term=${term}`
			)
		}).pipe(
			map(response => {
				return response.data
			})
		)
	}

	create(body: SupplierBody): Observable<ResponseQuery> {

		const jwt = localStorage.getItem("jwt") ?? "";

		return defer(() => {
			return axiosClientSecuredJsonContent(jwt).post<ResponseQuery>(
				`/supplier`, body
			)
		}).pipe(
			map(response => {
				return response.data
			})
		)
	}

	update(id: number, body: SupplierBody): Observable<ResponseQuery> {
		const jwt = localStorage.getItem("jwt") ?? "";

		return defer(() => {
			return axiosClientSecuredJsonContent(jwt).put<ResponseQuery>(
				`/supplier/${id}`, body
			)
		}).pipe(
			map(response => response.data)
		)
	}

	delete(id: number): Observable<ResponseQuery> {
		const jwt = localStorage.getItem("jwt") ?? "";

		return defer(() => {
			return axiosClientSecuredJsonContent(jwt).delete(`/supplier/${id}`)
		}).pipe(
			map(response => response.data)
		)
	}
}












