"use client"

import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Card, Input, Spin, message } from "antd";
import { useEffect, useState } from "react";
import { useServiceStore } from "../store/service.store";
import { useAuthenticatedStore } from "../store/authenticated.store";
import { useRouter } from "next/navigation";
import { catchError, EMPTY, Subscription, tap } from "rxjs";
import { AxiosError } from "axios";
import Image from "next/image";

export default function LoginPage() {
	const [usernameControl, setUsernameControl] = useState("");
	const [passwordControl, setPasswordControl] = useState("");

	const authService = useServiceStore((state) => state.authService);
	const setAuthenticatedUserState = useAuthenticatedStore((state) => state.setUserState);
	const localStorageService = useServiceStore((state) => state.localStorageService);

	const [isLoadingSubmit, setIsloadingSubmit] = useState(false);

	const router = useRouter();

	const subscription = new Subscription();

	const [messageApi, contextHolder] = message.useMessage();

	useEffect(() => {
		const jwt = localStorage.getItem("jwt") ?? "";

		if(jwt) {
			router.push("/dashboard/main");
		}

		return () => {
			subscription.unsubscribe();
		}
	}, []);

	const resetControl = () => {
		setUsernameControl("");
		setPasswordControl("");
	}

	const login = () => {
		setIsloadingSubmit(true);

		const loginSubscription = authService.login(usernameControl, passwordControl).pipe(
			tap(response => {
				setIsloadingSubmit(false);

				localStorageService.saveDataToStorage("jwt", response.token);

				resetControl();
				setAuthenticatedUserState(response.user);

				router.push("/dashboard/main");
			}),
			catchError((e: AxiosError<{ detail: string, statusCode: number }>) => {
                messageApi.open({
                  type: "error",
                  content: e.response?.data!.detail
                });
                setUsernameControl("");
                setPasswordControl("");
                setIsloadingSubmit(false);
        
                return EMPTY;
            })
		).subscribe();

		subscription.add(loginSubscription);
	}

	return(
		<>
			{ contextHolder }
			<div className="flex flex-row align-items-center jusitfy-content-center"
			style={
                {
                    height: '96vh',
                    background: '#fbfbfe'
                }
            }>
				<div className="w-full md:w-6 h-auto m-auto">
					<Spin spinning={ isLoadingSubmit } tip="Processing to Login...">
						<Card className="p-4">
						    <div className="flex flex-row justify-content-center">
		                        <img src="next.svg" className="mb-6 m-auto"
                                style={
                                {
                                    maxWidth: "128px",
                                    height: "auto",
                                }
                                } />
		                    </div>
		                    <Input size="large" placeholder="Username" value={ usernameControl }
		                    prefix={ <UserOutlined /> } className="mb-3" onChange={
		                    	(e) => {
		                    		setUsernameControl(e.target.value)
		                    	}
		                    } />
		                    <Input size="large" placeholder="Password" type="password" value={ passwordControl }
		                    prefix={ <LockOutlined /> } className="mb-3" onChange={
		                    	(e) => {
		                    		setPasswordControl(e.target.value)
		                    	}
		                    } />
		                    <Button className="w-full my-3" type="primary" size="large" 
		                    onClick={
		                    	(e) => {
		                    		login();
		                    	}
		                    }>Login</Button>
						</Card>
					</Spin>
				</div>	
			</div>
		</>
	)
}