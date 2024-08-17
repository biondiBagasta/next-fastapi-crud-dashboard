import { defer, map, Observable } from "rxjs";
import { User } from "../interfaces/user";
import { axiosClientJsonContent, axiosClientSecuredJsonContent } from "../utils/utils";

interface LoginResponse {
	user: User;
	token: string;
}

export class AuthService {
	login(username: string, password: string): Observable<LoginResponse> {
		return defer(() => {
			return axiosClientJsonContent.post<LoginResponse>(`/auth/login`, {
				username,
				password
			})
		}).pipe(
			map(response => response.data)
		)
	}

	authenticated(): Observable<LoginResponse> {
		const jwt = localStorage.getItem("jwt") ?? "";
		return defer(() => {
			return axiosClientSecuredJsonContent(jwt).post<LoginResponse>("/auth/authenticated")
		}).pipe(
			map(response => response.data)
		)
	}
}