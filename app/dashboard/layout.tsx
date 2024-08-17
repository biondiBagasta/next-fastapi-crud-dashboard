"use client"

import SidebarComponent from "../components/sidebar.component";
import TopNavbarComponent from "../components/top-navbar.component";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User } from "../interfaces/user";
import { useServiceStore } from "../store/service.store";
import { useAuthenticatedStore } from "../store/authenticated.store";
import { catchError, EMPTY, take, tap } from "rxjs";
import { AxiosError } from "axios";

export default function DashboardLayout(
	{ children } : { children: React.ReactNode }
) {

	const [isOpenedSidebar, setIsopenedSidebar] = useState(false);

	const authService = useServiceStore((state) => state.authService);
	const localStorageService = useServiceStore((state) => state.localStorageService);
	const authenticatedUser = useAuthenticatedStore((state) => state.userState);
	const setAuthenticatedUser = useAuthenticatedStore((state) => state.setUserState);

	const router = useRouter();

    useEffect(() => {
        const jwt = localStorage.getItem("jwt") ?? "";

        if(!jwt) {
            router.push("/login");
        } else {
            authService.authenticated().pipe(
                tap(response => {
                    setAuthenticatedUser(response.user);
                    localStorageService.saveDataToStorage("jwt", response.token);
                }),
                take(1),
                catchError((e: AxiosError<{ message: string, statusCode: number}>) => {
                    if(e.response?.data.statusCode == 401) {
                        router.push("/login");
                    }

                    return EMPTY;
                })
            ).subscribe();
        };
    }, []);

	return (
		<>
			<SidebarComponent isOpenedSidebar={ isOpenedSidebar }>
			</SidebarComponent>
			<div className="home-section">
				<TopNavbarComponent isOpenedSidebar={ isOpenedSidebar }
					onClickSidebarIcon={
							() => {
									setIsopenedSidebar(!isOpenedSidebar);
							}
					} user={ authenticatedUser }>

				</TopNavbarComponent>
					<div className="p-4 overflow-y-scroll" style={
						{
							height: '80vh'
						}
					}>
						{ children }
					</div>
			</div>
		</>
	)
} 