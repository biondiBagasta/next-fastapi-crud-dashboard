"use client"

import PageTitleComponent from "@/app/components/page-title.component";
import { useEffect, useState } from "react";
import { message, Modal, Button, Card, Input, Popconfirm, Spin, Empty, Pagination, DatePicker, Select,
Alert } from "antd"
import { catchError, EMPTY, forkJoin, Subscription, tap } from "rxjs";
import { useServiceStore } from "@/app/store/service.store";
import { AxiosError } from "axios";
import { SaveOutlined, DeleteOutlined, EditOutlined, PlusOutlined, CheckOutlined, MinusOutlined } from "@ant-design/icons";
import { errorColor, infoColor, primaryColor, secondaryColor, successColor, textColor } from "@/app/utils/utils";
import { Product } from "@/app/interfaces/product";
import { Restock } from "@/app/interfaces/restock";
import { Supplier } from "@/app/interfaces/supplier";
import { RestockDetail, RestockDetailProduct } from "@/app/interfaces/restock_detail";
import { maskitoDateOptionsGenerator, maskitoNumberOptionsGenerator } from "@maskito/kit";
import { maskitoTransform } from "@maskito/core";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { Search } = Input;

const maskitoCurrencyOptions = maskitoNumberOptionsGenerator({
    decimalZeroPadding: false,
    precision: 1,
    thousandSeparator: '.',
    decimalSeparator: ",",
    min: 0,
    prefix: 'Rp. ',
});

const maskitoDateOption = maskitoDateOptionsGenerator({mode: 'yyyy/mm/dd', separator: '-'});

export default function RestockPage() {
	const [restockDateControl, setRestockDateControl] = useState(new Date());
	const [amountControl, setAmountControl] = useState("");
	const [supplierControl, setSupplierControl] = useState("")

	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	const [isLoadingInitialize, setIsLoadingInitialize] = useState(false);
	const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

	const [dataList, setDataList] = useState<Restock[]>([]);
	const [selectedData, setSelectedData] = useState<Restock>({} as Restock);

	const [supplierList, setSupplierList] = useState<Supplier[]>([]);
	const [productList, setProductList] = useState<Product[]>([]);
	const [selectedProductList, setSelectedProductList] = useState<RestockDetailProduct[]>([]);

	const [isLoadingSearchProduct, setIsLoadingSearchProduct] = useState(false);

	const [currentPage, setCurrentPage] = useState(1);
	const [totalData, setTotalData] = useState(1);

	const [messageApi, contextHolder] = message.useMessage();

	const subscription = new Subscription();

	const supplierService = useServiceStore((state) => state.supplierService);
	const productService = useServiceStore((state) => state.productService);
	const restockService = useServiceStore((state) => state.restockService);

	const [isModalSelectProductOpen, setIsModalSelectProductOpen] = useState(false);

	useEffect(() => {
		initializeOption();
		initialize();
		
		return () => {
			subscription.unsubscribe();
		}
	}, []);

	const initializeOption = () => {
		const initializeOptionSubscription = forkJoin([
			supplierService.findMany().pipe(
				tap(data => setSupplierList(data))
			),
			productService.searchPaginate("", 1).pipe(
				tap(data => {
					setProductList(data.data);
				})
			)
		]).subscribe();

		subscription.add(initializeOptionSubscription);
	}


	const initialize = (page = 1) => {
		setIsLoadingInitialize(true);

		setCurrentPage(page);

		const initializeSubscription = restockService.paginate(page).pipe(
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
		setRestockDateControl(new Date());
		setAmountControl("");
		setSupplierControl("");
		setSelectedProductList([]);
	}

	const openCreateModal = () => {
		setIsCreateModalOpen(true);
	}

	const closeCreateModal = () => {
		resetFormControl();
		setIsCreateModalOpen(false);
	}

	const openEditModal = (data: Restock) => {
		const detail = JSON.parse(data.detail) as RestockDetail;
		const amountRp = maskitoTransform(data.amount.toString(), maskitoCurrencyOptions);
		setRestockDateControl(data.restock_date);
		setAmountControl(amountRp);
		setSupplierControl(detail.supplier)
		setSelectedData(data);
		setSelectedProductList(detail.products);
		setIsEditModalOpen(true);
	}

	const closeEditModal = () => {
		resetFormControl();
		setIsEditModalOpen(false);
	}

	const openSelectProductModal = () => {
		setIsModalSelectProductOpen(true);
	}

	const closeSelectProductModal = () => {
		setIsModalSelectProductOpen(false);
	}

	const searchSelectedProduct = (term: string) => {
		setIsLoadingSearchProduct(true);

		const searchSelectedProductSubscription = productService.searchPaginate(term, 1).pipe(
			tap(data => {
				setIsLoadingSearchProduct(false);

				setProductList(data.data);
			})
		).subscribe();

		subscription.add(searchSelectedProductSubscription);
	}

	const addSelectedProduct = (product: RestockDetailProduct) => {
		const findIndex = selectedProductList.findIndex(d => d.name == product.name);

		if(findIndex == -1) {
			const newProductList = selectedProductList.concat(product);
			setSelectedProductList(newProductList);

			const amountProductList = newProductList.map(d => {
				return d.qty * d.purchase_price
			});

			const amount = amountProductList.reduce((prev, curr) => prev + curr, 0);
			const transformedAmount = maskitoTransform(amount.toString(), maskitoCurrencyOptions);

			setAmountControl(transformedAmount);
		} else {
			message.open({
				type: "error",
				content: "Product is already selected."
			});
		}
	}

	const removeSelectedProduct = (product: RestockDetailProduct) => {
		const newProductList = selectedProductList.filter(d => d.name != product.name);
		setSelectedProductList(newProductList);

		const amountProductList = newProductList.map(d => d.purchase_price * d.qty);

		const amount = amountProductList.reduce((prev, curr) => prev + curr, 0);
		const transformedAmount = maskitoTransform(amount.toString(), maskitoCurrencyOptions);
		setAmountControl(transformedAmount);
	}

	const incrementQtySelectedProduct = (product: RestockDetailProduct) => {
		const mappedProductList = selectedProductList.map(d => {
			if(d.name == product.name) {
				return { ...d, qty: d.qty + 1 }
			} else {
				return d
			}
		});

		const amountProductList = mappedProductList.map(d => d.purchase_price * d.qty);

		const amount = amountProductList.reduce((prev, curr) => prev + curr, 0);
		const transformedAmount = maskitoTransform(amount.toString(), maskitoCurrencyOptions);

		setAmountControl(transformedAmount);

		setSelectedProductList(mappedProductList)
	}

	const decrementSelectedProduct = (product: RestockDetailProduct) => {
		const mappedProductList = selectedProductList.map(d => {
			if(d.name == product.name) {
				if(d.qty == 1)  {
					return d;
				} else {
					return { ...d, qty: d.qty - 1 }
				}
			} else {
				return d;
			}
		});

		const amountProductList = mappedProductList.map(d => d.purchase_price * d.qty);

		const amount = amountProductList.reduce((prev, curr) => prev + curr, 0);
		const transformedAmount = maskitoTransform(amount.toString(), maskitoCurrencyOptions);

		setAmountControl(transformedAmount);

		setSelectedProductList(mappedProductList)
	}

	const checkIfProductSelected = (product: RestockDetailProduct): boolean => {
		const findIndex = selectedProductList.findIndex(d => d.name == product.name);

		if(findIndex == -1) {
			return false;
		} else {
			return true
		}
	}

	const createData = () => {
		setIsLoadingSubmit(true);

		const amount = Number(amountControl.replaceAll(/[^0-9]/g, ""));
		const detail: RestockDetail = {
			supplier: supplierControl,
			products: selectedProductList,
		} 

		const createSubscription = restockService.create({ 
			restock_date: restockDateControl,
			detail: JSON.stringify(detail),
			amount: amount 
		}).pipe(
			tap(response => {
				setIsLoadingSubmit(false);
				setCurrentPage(1);

				initialize();

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

		const amount = Number(amountControl.replaceAll(/[^0-9]/g, ""));
		const detail: RestockDetail = {
			supplier: supplierControl,
			products: selectedProductList,
		} 

		const updateSubscription = restockService.update(selectedData.id, {
			restock_date: restockDateControl,
			amount: amount,
			detail: JSON.stringify(detail)
		}).pipe(
			tap(response => {
				setIsLoadingSubmit(false);
				setCurrentPage(1);

				initialize();

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
		const deleteSubscription = restockService.delete(id).pipe(
			tap(response => {
				setCurrentPage(1);

				initialize();

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

			<Modal title="Add Restock Data" width={ 800 } 
			okButtonProps={
				{
					icon: <SaveOutlined />,
					disabled: !amountControl || !supplierControl ||
					selectedProductList.length == 0 
				}
			} okText="Submit" onOk={ createData }
			open={ isCreateModalOpen } onCancel={ closeCreateModal }>
				<div className="p-2">
					<Spin spinning={ isLoadingSubmit } tip="Creating Data..."
					size="large">
						<div className="my-2">
                            <div className="text-base font-semibold mb-1">Restock Date</div>
                            <DatePicker size="large" className="w-full" onChange={
                            	(e) => {
                            		setRestockDateControl(e.toDate());
                            	}
                            } />
                        </div>
                        <div className="my-2 w-full">
                            <div className="text-base font-semibold mb-1">Supplier</div>
                            <Select size="large" placeholder="Select Supplier" className="w-full"
                            showSearch optionFilterProp="label" 
                            filterSort={(optionA, optionB) =>
						      (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
						    } options={
						    	supplierList.map(d => {
						    		return { value: d.id, label: d.name }
						    	})
						    } onChange={
						    	(e) => {
						    		const selectedSupplierName = supplierList.filter(d => d.id == e)[0].name;
						    		setSupplierControl(selectedSupplierName);
						    	}
						    } />
                        </div>
                        <Button shape="round" icon={
                            <PlusOutlined style={
                                {
                                    color: textColor
                                }
                            } />
                        } style={
                            {
                                background: secondaryColor,
                                color: textColor
                            }
                        } type="primary" onClick={
                            (e) => {
                                openSelectProductModal();
                            }
                        } className="mb-3">
                            Add Restock Product
                        </Button>

                        {
                        	selectedProductList.length == 0 ?
                        	<Alert className="my-3"
                                message="Information"
                                description="Restocked Product must be selected."
                                type="info"
                                showIcon
                            /> :
                            selectedProductList.map((d, index) => {
                            	return <div key={ index } className="my-3" style={
                                    {
                                        cursor: "pointer"
                                    }
                                }>
                                    <div className="flex flex-row justify-content-between align-items-center mb-2">
                                        <div className="flex flex-row gap-3 align-items-center">
                                        	<Button 
                                        	onClick={
                                        		(e) => {
                                        			decrementSelectedProduct(d);
                                        		}
                                        	}
                                        	style={
                                        		{
                                        			background: errorColor
                                        		}
                                        	} icon={<MinusOutlined />}></Button>
                                        	<div className="text-lg font-semibold">
                                        		{ d.qty }
                                        	</div>
                                        	<Button 
                                        	onClick={
                                        		(e) => {
                                        			incrementQtySelectedProduct(d);
                                        		}
                                        	}
                                        	style={
                                        		{
                                        			background: primaryColor
                                        		}
                                        	} icon={ <PlusOutlined /> }></Button>
                                        	<div className="flex flex-column gap-2">
                                        		<div className="text-base font-normal">
                                            		{ d.name }
                                        		</div>
                                        		<div className="font-bold text-base">
                                        			{ maskitoTransform(d.purchase_price.toString(), maskitoCurrencyOptions) }
                                        		</div>
                                        	</div>
                                        </div>
                                        <Button
                                        onClick={
                                            (e) => {
                                                removeSelectedProduct(d);
                                            }
                                        }
                                        style={
                                            {
                                                background: `${errorColor}`
                                            }
                                        }
                                        icon={ <DeleteOutlined style={
                                            {
                                            color: "#fff"
                                            }
                                        } /> } />
                                    </div>
                                    <div className="w-full" style={
                                        {
                                            background: "#dadce0",
                                            height: "1px"
                                        }
                                    }></div>
                                </div>
                            })
                        }

                        <div className="my-2">
                            <div className="text-base font-semibold mb-1">Amount</div>
                            <Input size="large" placeholder="Amount" value={ amountControl } readOnly={ true }
                                onChange={
                                (e) => {
                                		const transformedValue = maskitoTransform(e.target.value, maskitoCurrencyOptions);
                                    	setAmountControl(transformedValue);
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
					disabled: !restockDateControl || !amountControl || !supplierControl ||
					selectedProductList.length == 0
				}
			} okText="Submit" onOk={ updateData }
			open={ isEditModalOpen } onCancel={ closeEditModal }>
				<div className="p-2">
					<Spin spinning={ isLoadingSubmit } tip="Updating Data..."
					size="large">
						<div className="my-2">
                            <div className="text-base font-semibold mb-1">Restock Date</div>
                            <DatePicker className="w-full" onChange={
                            	(e) => {
                            		setRestockDateControl(e.toDate());
                            	}
                            } />
                        </div>
                        <div className="my-2 w-full">
                            <div className="text-base font-semibold mb-1">Supplier</div>
                            <Select size="large" placeholder="Select Supplier" className="w-full"
                            showSearch optionFilterProp="label" 
                            filterSort={(optionA, optionB) =>
						      (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
						    } options={
						    	supplierList.map(d => {
						    		return { value: d.id, label: d.name }
						    	})
						    } onChange={
						    	(e) => {
						    		setSupplierControl(e);
						    	}
						    } />
                        </div>
						<Button shape="round" icon={
                            <PlusOutlined style={
                                {
                                    color: textColor
                                }
                            } />
                        } style={
                            {
                                background: secondaryColor,
                                color: textColor
                            }
                        } type="primary" onClick={
                            (e) => {
                                openSelectProductModal();
                            }
                        } className="mb-3">
                            Add Restock Product
                        </Button>

                        {
                        	selectedProductList.length == 0 ?
                        	<Alert className="my-3"
                                message="Information"
                                description="Restocked Product must be selected."
                                type="info"
                                showIcon
                            /> :
                            selectedProductList.map((d, index) => {
                            	return <div key={ index } className="my-3" style={
                                    {
                                        cursor: "pointer"
                                    }
                                }>
                                    <div className="flex flex-row justify-content-between align-items-center mb-2">
                                        <div className="flex flex-row gap-3 align-items-center">
                                        	<Button 
                                        	onClick={
                                        		(e) => {
                                        			decrementSelectedProduct(d);
                                        		}
                                        	}
                                        	style={
                                        		{
                                        			background: errorColor
                                        		}
                                        	} icon={<MinusOutlined />}></Button>
                                        	<div className="text-base font-semibold">
                                        		{ d.qty }
                                        	</div>
                                        	<Button 
                                        	onClick={
                                        		(e) => {
                                        			incrementQtySelectedProduct(d);
                                        		}
                                        	}
                                        	style={
                                        		{
                                        			background: primaryColor
                                        		}
                                        	} icon={ <PlusOutlined /> }></Button>
                                        	<div className="flex flex-column gap-2">
                                        		<div className="text-base font-normal">
                                            		{ d.name }
                                        		</div>
                                        		<div className="font-bold text-base">
                                        			{ maskitoTransform(d.purchase_price.toString(), maskitoCurrencyOptions) }
                                        		</div>
                                        	</div>
                                        </div>
                                        <Button
                                        onClick={
                                            (e) => {
                                                removeSelectedProduct(d);
                                            }
                                        }
                                        style={
                                            {
                                                background: `${errorColor}`
                                            }
                                        }
                                        icon={ <DeleteOutlined style={
                                            {
                                            color: "#fff"
                                            }
                                        } /> } />
                                    </div>
                                    <div className="w-full" style={
                                        {
                                            background: "#dadce0",
                                            height: "1px"
                                        }
                                    }></div>
                                </div>
                            })
                        }

                        <div className="my-2">
                            <div className="text-base font-semibold mb-1">Amount</div>
                            <Input size="large" placeholder="Amount" value={ amountControl } readOnly={ true }
                            />
                        </div>
					</Spin>
				</div>
			</Modal>

			{/* Select Product Modal */}
            <Modal width={ 800 } open={ isModalSelectProductOpen } 
            destroyOnClose={ true } title="Select Restocked Product" 
            onCancel={
                (e) => {
                    closeSelectProductModal();
                }
            } footer={ null }>
                <Spin spinning={ isLoadingSearchProduct } size="large">
                    <div className="p-3">
                        <Search placeholder="Enter to search Product data..."
                        loading={ isLoadingSearchProduct } className="mb-5"
                        onSearch={
                            (e) => {
                                searchSelectedProduct(e);
                            }
                        } />
                        
                        {
                            productList.length > 0 ? <div>
                                {
                                    productList.map((d, index) => {
                                        return <div key={ index } className="my-3" style={
                                            {
                                                cursor: "pointer"
                                            }
                                        }>
                                            <div className="flex flex-row justify-content-between align-items-center">
                                                <div className="flex flex-row gap-4 align-items-center" 
                                                onClick={
                                                    (e) => {
                                                        addSelectedProduct({
                                                        	name: d.name,
                                                        	purchase_price: d.purchase_price,
                                                        	qty: 1
                                                        });
                                                    }
                                                }>
                                                    {
                                                        checkIfProductSelected({
                                                        	name: d.name,
                                                        	purchase_price: d.purchase_price,
                                                        	qty: 1
                                                        }) ? <CheckOutlined style={
                                                            {
                                                                color: successColor,
                                                                fontSize: "1rem"
                                                            }
                                                        } /> : <></>
                                                    }
                                                    <div className="text-base font-normal mb-1">
                                                        { d.name }
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="w-full mt-2" style={
                                                {
                                                    background: "#dadce0",
                                                    height: "1px"
                                                }
                                            }></div>
                                        </div>
                                    })
                                }
                            </div>
                            :
                            <Empty description="Tidak Ada Data Area Domisili" />
                        }
                    </div>
                </Spin>
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
                        
                        <RangePicker onChange={
                        	(e) => {
                        		console.log(e);
                        	}
                        } />
                    </div>

                    <Spin spinning={ isLoadingInitialize } size="large">
                        <div className="table-container">
                            <table className="table is-fullwidth is-hoverable is-striped">
                                <thead>
                                    <tr>
	                                    <th>Restock Date</th>
	                                    <th>Amount</th>
	                                    <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                    	dataList.length == 0 ? <></> :
                                    	dataList.map((d, index) => (
	                                    <tr key={ index }>
	                                        <td>{ 
	                                        	dayjs(d.restock_date).format("DD/MM/YYYY HH:mm:ss")
	                                         }</td>
	                                        <td>{ maskitoTransform(d.amount.toString(), maskitoCurrencyOptions) }</td>
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
                            			// searchPaginate(e);
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