"use client"

import PageTitleComponent from "@/app/components/page-title.component";
import { useEffect, useState } from "react";
import { message, Modal, Button, Card, Input, Popconfirm, Spin, Empty, Pagination } from "antd"
import { catchError, EMPTY, Subscription, tap } from "rxjs";
import { useServiceStore } from "@/app/store/service.store";
import { AxiosError } from "axios";
import { SaveOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { errorColor, infoColor, primaryColor } from "@/app/utils/utils";
import { Supplier } from "@/app/interfaces/supplier";

const { Search } = Input;

export default function SupplierPage() {
	const [nameControl, setNameControl] = useState("");
	const [addressControl, setAddressControl] = useState("");
	const [phoneNumberControl, setPhoneNumberControl] = useState("");

	const [searchControl, setSearchControl] = useState("");

	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	const [isLoadingInitialize, setIsLoadingInitialize] = useState(false);
	const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

	const [dataList, setDataList] = useState<Supplier[]>([]);
	const [selectedData, setSelectedData] = useState<Supplier>({} as Supplier);

	const [currentPage, setCurrentPage] = useState(1);
	const [totalData, setTotalData] = useState(1);

	const [messageApi, contextHolder] = message.useMessage();

	const subscription = new Subscription();

	const supplierService = useServiceStore((state) => state.supplierService);

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

		const initializeSubscription = supplierService.searchPaginate(searchControl, page).pipe(
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
		setAddressControl("");
		setPhoneNumberControl("");
	}

	const openCreateModal = () => {
		setIsCreateModalOpen(true);
	}

	const closeCreateModal = () => {
		resetFormControl();
		setIsCreateModalOpen(false);
	}

	const openEditModal = (data: Supplier) => {
		setNameControl(data.name);
		setAddressControl(data.address);
		setPhoneNumberControl(data.phone_number)
		setSelectedData(data);
		setIsEditModalOpen(true);
	}

	const closeEditModal = () => {
		resetFormControl();
		setIsEditModalOpen(false);
	}

	const createData = () => {
		setIsLoadingSubmit(true);

		const createSubscription = supplierService.create({ 
			name: nameControl,
			address: addressControl,
			phone_number: phoneNumberControl 
		}).pipe(
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

		const updateSubscription = supplierService.update(selectedData.id, {
			name: nameControl,
			address: addressControl,
			phone_number: phoneNumberControl
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
		const deleteSubscription = supplierService.delete(id).pipe(
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

			<Modal title="Add Supplier" width={ 800 } 
			okButtonProps={
				{
					icon: <SaveOutlined />,
					disabled: !nameControl || !addressControl || !phoneNumberControl
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
                        <div className="my-2">
                            <div className="text-base font-semibold mb-1">Address</div>
                            <Input size="large" placeholder="Username" value={ addressControl } 
                                onChange={
                                (e) => {
                                    	setAddressControl(e.target.value);
                                	}
                                } 
                            />
                        </div>
                        <div className="my-2">
                            <div className="text-base font-semibold mb-1">Phone Number</div>
                            <Input size="large" placeholder="Username" value={ phoneNumberControl } 
                                onChange={
                                (e) => {
                                    	setPhoneNumberControl(e.target.value);
                                	}
                                } 
                            />
                        </div>
					</Spin>
				</div>
			</Modal>

			<Modal title="Edit Supplier" width={ 800 } 
			okButtonProps={
				{
					icon: <SaveOutlined />,
					disabled: !nameControl || !addressControl || !phoneNumberControl
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
                        <div className="my-2">
                            <div className="text-base font-semibold mb-1">Address</div>
                            <Input size="large" placeholder="Username" value={ addressControl } 
                                onChange={
                                (e) => {
                                    	setAddressControl(e.target.value);
                                	}
                                } 
                            />
                        </div>
                        <div className="my-2">
                            <div className="text-base font-semibold mb-1">Phone Number</div>
                            <Input size="large" placeholder="Username" value={ phoneNumberControl } 
                                onChange={
                                (e) => {
                                    	setPhoneNumberControl(e.target.value);
                                	}
                                } 
                            />
                        </div>
					</Spin>
				</div>
			</Modal>

			<PageTitleComponent title="Supplier" subtitle="Dashboard" />

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
	                                    <th>Address</th>
	                                    <th>Phone Number</th>
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
	                                        <td>{ d.address }</td>
	                                        <td>{ d.phone_number }</td>
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
	                                            <Popconfirm title="Delete Supplier" description={
	                                            `Are you sure want to delete this ${d.name} Supplier data???`
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