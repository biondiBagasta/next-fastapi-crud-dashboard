"use client"

import PageTitleComponent from "@/app/components/page-title.component";
import { Category } from "@/app/interfaces/category";
import { useEffect, useState } from "react";
import { message, Modal, Button, Card, Input, Popconfirm, Spin, Empty, Pagination } from "antd"
import { catchError, EMPTY, Subscription, tap } from "rxjs";
import { useServiceStore } from "@/app/store/service.store";
import { AxiosError } from "axios";
import { SaveOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { errorColor, infoColor, primaryColor } from "@/app/utils/utils";

const { Search } = Input;

export default function CategoryPage() {
	const [nameControl, setNameControl] = useState("");

	const [searchControl, setSearchControl] = useState("");

	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	const [isLoadingInitialize, setIsLoadingInitialize] = useState(false);
	const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

	const [dataList, setDataList] = useState<Category[]>([]);
	const [selectedData, setSelectedData] = useState<Category>({} as Category);

	const [currentPage, setCurrentPage] = useState(1);
	const [totalData, setTotalData] = useState(1);

	const [messageApi, contextHolder] = message.useMessage();

	const subscription = new Subscription();

	const categoryService = useServiceStore((state) => state.categoryService);

	useEffect(() => {
		searchPaginate();
		
		return () => {
			subscription.unsubscribe();
		}
	}, []);

	useEffect(() => {
		searchPaginate()
	}, [searchControl])

	const searchPaginate = (page = 1) => {
		setIsLoadingInitialize(true);

		setCurrentPage(page);

		const initializeSubscription = categoryService.searchPaginate(searchControl, page).pipe(
			tap(response => {
				setDataList(response.data);
				setTotalData(response.paginate.count);
				setIsLoadingInitialize(false);
			}),
			catchError((e: AxiosError<{ detail: string, statusCode: number }>) => {
				messageApi.open({
					type: "error",
					content: `${e.response?.data.detail}`
				})
				return EMPTY;
			}),
		).subscribe();

		subscription.add(initializeSubscription);
	}

	const resetFormControl = () => {
		setNameControl("");
	}

	const openCreateModal = () => {
		setIsCreateModalOpen(true);
	}

	const closeCreateModal = () => {
		resetFormControl();
		setIsCreateModalOpen(false);
	}

	const openEditModal = (data: Category) => {
		setNameControl(data.name);
		setSelectedData(data);
		setIsEditModalOpen(true);
	}

	const closeEditModal = () => {
		resetFormControl();
		setIsEditModalOpen(false);
	}

	const createData = () => {
		setIsLoadingSubmit(true);

		const createSubscription = categoryService.create({ name: nameControl }).pipe(
			tap(response => {
				setIsLoadingSubmit(false);
				setCurrentPage(1);

				searchPaginate();

				closeCreateModal();

				message.open({
					type: response.status ? "success" : "error",
					content: response.message
				})
			}),
			catchError((e: AxiosError<{ detail: string, statusCode: number }>) => {
				setIsLoadingSubmit(false);
				messageApi.open({
					type: "error",
					content: `${e.response?.data.detail}`
				})
				return EMPTY;
			})
		).subscribe();

		subscription.add(createSubscription);
	}

	const updateData = () => {
		setIsLoadingSubmit(true);

		const updateSubscription = categoryService.update(selectedData.id, {
			name: nameControl
		}).pipe(
			tap(response => {
				setIsLoadingSubmit(false);
				setCurrentPage(1);

				searchPaginate();

				closeEditModal();

				message.open({
					type: response.status ? "info" : "error",
					content: response.message
				})
			}),
			catchError((e: AxiosError<{ detail: string, statusCode: number }>) => {
				setIsLoadingSubmit(false);
				messageApi.open({
					type: "error",
					content: `${e.response?.data.detail}`
				})
				return EMPTY;
			})
		).subscribe();

		subscription.add(updateSubscription);
	}

	const deleteData = (id: number) => {
		const deleteSubscription = categoryService.delete(id).pipe(
			tap(response => {
				setCurrentPage(1);

				searchPaginate();

				message.open({
					type: response.status ? "info" : "error",
					content: response.message
				})
			}),
			catchError((e: AxiosError<{ detail: string, statusCode: number }>) => {
				messageApi.open({
					type: "error",
					content: `${e.response?.data.detail}`
				})
				return EMPTY;
			})
		).subscribe();

		subscription.add(deleteSubscription);
	}

	return (
		<>
			{ contextHolder }

			<Modal title="Add Category" width={ 800 } 
			okButtonProps={
				{
					icon: <SaveOutlined />,
					disabled: !nameControl
				}
			} okText="Submit" onOk={ createData }
			open={ isCreateModalOpen } onCancel={ closeCreateModal }>
				<div className="p-2">
					<Spin spinning={ isLoadingSubmit } tip="Creating Data..."
					size="large">
						<div className="my-2">
                            <div className="text-base font-semibold mb-1">Name</div>
                            <Input size="large" placeholder="Username" value={ nameControl } 
                                onChange={
                                (e) => {
                                    	setNameControl(e.target.value);
                                	}
                                } 
                            />
                        </div>
					</Spin>
				</div>
			</Modal>

			<Modal title="Edit Category" width={ 800 } 
			okButtonProps={
				{
					icon: <SaveOutlined />,
					disabled: !nameControl
				}
			} okText="Submit" onOk={ updateData }
			open={ isEditModalOpen } onCancel={ closeEditModal }>
				<div className="p-2">
					<Spin spinning={ isLoadingSubmit } tip="Updating Data..."
					size="large">
						<div className="my-2">
                            <div className="text-base font-semibold mb-1">Name</div>
                            <Input size="large" placeholder="Username" value={ nameControl } 
                                onChange={
                                (e) => {
                                    	setNameControl(e.target.value)
                                	}
                                } 
                            />
                        </div>
					</Spin>
				</div>
			</Modal>

			<PageTitleComponent title="Category" subtitle="Dashboard" />

			<div className="mt-3">
				<Card>
					<div className="flex flex-row justify-content-between align-items-center mb-3">
                        <Button onClick={
                            (e) => {
                                openCreateModal();
                            }
                        } style={
                            {
                                background: primaryColor,
                                color: "#fff"
                            }
                        } size="large" icon={ <PlusOutlined /> } shape="round">
                            Add Data
                        </Button>
                        
                        <Search placeholder="Search Data..." className="w-4" onSearch={
                        	(e) => {
                        		setSearchControl(e);
                        	}
                        }></Search>
                    </div>

                    <Spin spinning={ isLoadingInitialize } size="large">
                        <div className="table-container">
                            <table className="table is-fullwidth is-hoverable is-striped">
                                <thead>
                                    <tr>
	                                    <th>No.</th>
	                                    <th>Name</th>
	                                    <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                    	dataList.length == 0 ? <></> :
                                    	dataList.map((d, index) => (
	                                    <tr key={ index }>
	                                        <td>{ index + 1 }</td>
	                                        <td>{ d.name }</td>
	                                        <td>
	                                        <div className="flex flex-row align-items-center gap-2">
	                                            <Button 
	                                            onClick={
	                                                (e) => {
	                                                    openEditModal(d);
	                                                }
	                                            }
	                                            style={
		                                            {
		                                                border: `1px solid ${infoColor}`
		                                            }
	                                            }
	                                            icon={ <EditOutlined style={
		                                            {
		                                                color: infoColor
		                                            }
	                                            } />} />
	                                            <Popconfirm title="Delete Category" description={
	                                            `Are you sure want to delete this ${d.name} Category data???`
	                                            } 
	                                            okText="Delete" 
	                                            cancelText="Cancel"
	                                            onConfirm={ 
	                                            (e) => {
	                                                	deleteData(d.id);
	                                            	}
	                                            }
	                                            >
	                                            <Button
	                                            style={
	                                                {
	                                                	border: `1px solid ${errorColor}`
	                                                }
	                                            }
	                                            icon={ <DeleteOutlined style={
	                                                {
	                                                color: errorColor
	                                                }
	                                            } /> } />
	                                            </Popconfirm>
	                                        </div>
	                                        </td>
	                                    </tr>
	                                    ))
                                    }
                                </tbody>
                            </table>
                            {
                            	dataList.length > 0 ? <Pagination total={ totalData } pageSize={ 10 }
                            	defaultCurrent={ currentPage } align="center" 
                            	onChange={
                            		(e) => {
                            			searchPaginate(e);
                            		}
                            	} /> : <></>
                            }
                            {
                            	dataList.length == 0 ?
                            	<div className="flex flex-row justify-content-center w-full mt-5">
                            		<Empty />
                            	</div>
                            	: <></>
                            }
                        </div>
                    </Spin>
				</Card>
			</div>
		</>
	)
}