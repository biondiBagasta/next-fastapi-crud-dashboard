"use client"

import { Category } from "@/app/interfaces/category";
import { Product } from "@/app/interfaces/product";
import { useEffect, useState } from "react"
import PageTitleComponent from "@/app/components/page-title.component";
import { message, UploadProps, Modal, Button, Card, Input, Popconfirm, Spin, Empty, Pagination, Select,
Upload, Avatar } from "antd";
import { catchError, EMPTY, retry, Subscription, switchMap, tap } from "rxjs";
import { useServiceStore } from "@/app/store/service.store";
import { baseUrl, errorColor, infoColor, primaryColor } from "@/app/utils/utils";
import { AxiosError } from "axios";
import { SaveOutlined, DeleteOutlined, EditOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
const { Search } = Input;
const { Dragger } = Upload;
import { useMaskito } from "@maskito/react";
import { MaskitoOptions, maskitoTransform } from "@maskito/core";
import { maskitoNumberOptionsGenerator } from '@maskito/kit';

const maskitoOnlyNumberOptions: MaskitoOptions = {
    mask: /^\d+$/
}

const maskitoPercentOptions = maskitoNumberOptionsGenerator({
    postfix: "%",
    min: 0,
    max: 100,
    precision: 2
});

const maskitoCurrencyOptions = maskitoNumberOptionsGenerator({
    decimalZeroPadding: false,
    precision: 1,
    thousandSeparator: '.',
    decimalSeparator: ",",
    min: 0,
    prefix: 'Rp. ',
});

export default function ProductPage() {

	const [codeControl, setCodeControl] = useState("");
	const [nameControl, setNameControl] = useState("");
	const [purchasePriceControl, setPurchasePriceControl] = useState("");
	const [sellingPriceControl, setSellingPriceControl] = useState("");
	const [stockControl, setStockControl] = useState("");
	const [discountControl, setDiscountControl] = useState("");
	const [categoryIdControl, setCategoryIdControl] = useState(0);
	const [imageControl, setImageControl] = useState<File | null>(null);

	const [searchControl, setSearchControl] = useState("");

	const [isLoadingInitialize, setIsLoadingInitialize] = useState(false);
	const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	const [dataList, setDataList] = useState<Product[]>([]);
	const [selectedData, setSelectedData] = useState<Product>({} as Product);
	const [categoryList, setCategoryList] = useState<Category[]>([]);

	const [currentPage, setCurrentPage] = useState(1);
	const [totalData, setTotalData] = useState(1);

	const [messageApi, contextHolder] = message.useMessage();

	const subscription = new Subscription();

	const categoryService = useServiceStore((state) => state.categoryService);
	const productService = useServiceStore((state) => state.productService);

	const uploadProps: UploadProps = {
        maxCount: 1,
        accept: "image/*",
        multiple: false,
        beforeUpload: (file) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = async (e) => {
                const convertedBase64toBlob = await fetch(`${e.target?.result}`);
                const blob = await convertedBase64toBlob.blob();
                const convertedBlobToFile = new File([blob], file.name);

                setImageControl(convertedBlobToFile);
            }

        }
    };

    const baseUrlProductImage = `${baseUrl}/files/product/image`;

    useEffect(() => {
    	searchPaginate();

    	initializeCategory();

    	return () => {
    		subscription.unsubscribe();
    	}
    }, []);

    useEffect(() => {
    	searchPaginate(currentPage);
    }, [searchControl]);

    const resetFormControl = () => {
    	setCodeControl("");
    	setNameControl("");
    	setPurchasePriceControl("");
    	setSellingPriceControl("");
    	setStockControl("");
    	setDiscountControl("");
    	setCategoryIdControl(0);
    	setImageControl(null);
    }

    const initializeCategory = () => {
    	const initializeCategorySubscription = categoryService.findMany().pipe(
    		tap(data => {
    			setCategoryList(data);
    		})
    	).subscribe();

    	subscription.add(initializeCategorySubscription);
    }

    const searchPaginate = (page = 1) => {
    	setIsLoadingInitialize(true);

    	setCurrentPage(page);

    	const initalizeSubscription = productService.searchPaginate(searchControl, page).pipe(
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

    	subscription.add(initalizeSubscription);
    }

    const openCreateModal = () => {
    	setIsCreateModalOpen(true);
    }

    const closeCreateModal = () => {
    	resetFormControl();
    	setIsCreateModalOpen(false);
    }

    const openEditModal = (data: Product) => {
    	const transformedPurchasePrice = maskitoTransform(data.purchase_price.toString(), maskitoCurrencyOptions);
    	const transformedSellingPrice = maskitoTransform(data.selling_price.toString(), maskitoCurrencyOptions);
    	const transformedDiscount = maskitoTransform(data.discount.toString(), maskitoPercentOptions);

    	setCodeControl(data.code);
    	setNameControl(data.name);
    	setPurchasePriceControl(transformedPurchasePrice);
    	setSellingPriceControl(transformedSellingPrice);
    	setDiscountControl(transformedDiscount);
    	setStockControl(data.stock.toString());
    	setCategoryIdControl(data.category_id);

    	setSelectedData(data);

    	setIsEditModalOpen(true);
    }

    const closeEditModal = () => {
    	resetFormControl();

    	setIsEditModalOpen(false);
    }

    const createData = () => {
    	setIsLoadingSubmit(true);

    	const formData = new FormData();

    	const purchase_price = Number(purchasePriceControl.replaceAll(/[^0-9]/g, ""));
    	const selling_price = Number(sellingPriceControl.replaceAll(/[^0-9]/g, ""));
    	const discount = Number(discountControl.replaceAll(/[^0-9]/g, ""));
    	const stock = Number(stockControl);

    	formData.append("product_image", imageControl!);

    	const createSubscription = productService.uploadProductImage(formData).pipe(
    		retry(3),
    		switchMap(fileresponse => {
    			return productService.create({
    				code: codeControl,
    				name: nameControl,
    				purchase_price: purchase_price,
    				selling_price: selling_price,
    				stock: stock,
    				discount: discount,
    				category_id: categoryIdControl,
    				image: fileresponse.filename
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
    			)
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

    	const purchase_price = Number(purchasePriceControl.replaceAll(/[^0-9]/g, ""));
    	const selling_price = Number(sellingPriceControl.replaceAll(/[^0-9]/g, ""));
    	const discount = Number(discountControl.replaceAll(/[^0-9]/g, ""));
    	const stock = Number(stockControl);

    	if(imageControl) {
    		const formData = new FormData();

    		formData.append("product_image", imageControl);

    		const updateSubscription = productService.deleteProductImage(selectedData.image).pipe(
    			switchMap(() => {
    				return productService.uploadProductImage(formData).pipe(
    					retry(3),
    					switchMap(fileResponse => {
    						return productService.update(
    							selectedData.id,
    							{
    								name: nameControl,
    								code: codeControl,
    								purchase_price: purchase_price,
    								selling_price: selling_price,
    								stock: stock,
    								discount: discount,
    								category_id: categoryIdControl,
    								image: fileResponse.filename
    							}
    						).pipe(
    							tap(response => {
									setIsLoadingSubmit(false);
									setCurrentPage(1);

									searchPaginate();

									closeEditModal();

									message.open({
										type: response.status ? "info" : "error",
										content: response.message
									})
    							})
    						)
    					}),
						catchError((e: AxiosError<{ detail: string, statusCode: number }>) => {
							setIsLoadingSubmit(false);
							messageApi.open({
								type: "error",
								content: `${e.response?.data.detail}`
							})
							return EMPTY;
						})
    				)
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
    	} else {
    		const updateSubscription = productService.update(
    			selectedData.id,
    			{
    				code: codeControl,
    				name: nameControl,
    				purchase_price: purchase_price,
    				selling_price: selling_price,
    				stock: stock,
    				discount: discount,
    				category_id: categoryIdControl,
    				image: selectedData.image
    			}
    		).pipe(
    			tap(response => {
    				setIsLoadingSubmit(false);
					setCurrentPage(1);

					searchPaginate();

					closeEditModal();

					message.open({
						type: response.status ? "info" : "error",
						content: response.message
					})
    			})
    		).subscribe();

    		subscription.add(updateSubscription);
    	}
    }

    const deleteData = (id: number, image: string) => {
    	const deleteSubscription = productService.deleteProductImage(image).pipe(
    		switchMap(() => {
    			return productService.delete(id).pipe(
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
    			)
    		})
    	).subscribe();

    	subscription.add(deleteSubscription);
    }

    return (
    	<>
    		{ contextHolder }

    		<Modal title="Add Product" width={ 800 } 
			okButtonProps={
				{
					icon: <SaveOutlined />,
					disabled: !codeControl || !nameControl || !purchasePriceControl || !sellingPriceControl
					|| !stockControl || !discountControl || !categoryIdControl || !imageControl
				}
			} okText="Submit" onOk={ createData }
			open={ isCreateModalOpen } onCancel={ closeCreateModal }>
				<div className="p-2">
					<Spin spinning={ isLoadingSubmit } tip="Creating Data..."
					size="large">
						<div className="my-2">
                            <div className="text-base font-semibold mb-1">Code</div>
                            <Input size="large" placeholder="Product Code" value={ codeControl } 
                                onChange={
                                (e) => {
                                    	setCodeControl(e.target.value);
                                	}
                                } 
                            />
                        </div>
                        <div className="my-2">
                            <div className="text-base font-semibold mb-1">Name</div>
                            <Input size="large" placeholder="Product Name" value={ nameControl } 
                                onChange={
                                (e) => {
                                    	setNameControl(e.target.value);
                                	}
                                } 
                            />
                        </div>
                        <div className="my-2">
                            <div className="text-base font-semibold mb-1">Purchase Price</div>
                            <Input size="large" placeholder="Purchase Price" value={ purchasePriceControl }
                                onChange={
                                (e) => {
                                		const transformedValue = maskitoTransform(e.target.value, maskitoCurrencyOptions);
                                    	setPurchasePriceControl(transformedValue);
                                	}
                                } 
                            />
                        </div>
                        <div className="my-2">
                            <div className="text-base font-semibold mb-1">Selling Price</div>
                            <Input size="large" placeholder="Selling Price" value={ sellingPriceControl } 
                                onChange={
                                (e) => {
                                		const transformedValue = maskitoTransform(e.target.value, maskitoCurrencyOptions);
                                    	setSellingPriceControl(transformedValue);
                                	}
                                } 
                            />
                        </div>
                        <div className="my-2">
                            <div className="text-base font-semibold mb-1">Stock</div>
                            <Input size="large" placeholder="Product Code" type="number" value={ stockControl } 
                                onChange={
                                (e) => {
                                    	setStockControl(e.target.value);
                                	}
                                } 
                            />
                        </div>
                        <div className="my-2">
                            <div className="text-base font-semibold mb-1">Discount</div>
                            <Input size="large" placeholder="Product Code" value={ discountControl } 
                                onChange={
                                (e) => {
                                		const transformedValue = maskitoTransform(e.target.value, maskitoPercentOptions);
                                    	setDiscountControl(transformedValue);
                                	}
                                } 
                            />
                        </div>
                        <div className="my-2 w-full">
                            <div className="text-base font-semibold mb-1">Category</div>
                            <Select size="large" placeholder="Select Category" className="w-full"
                            showSearch optionFilterProp="label" 
                            filterSort={(optionA, optionB) =>
						      (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
						    } options={
						    	categoryList.map(d => {
						    		return { value: d.id, label: d.name }
						    	})
						    } onChange={
						    	(e) => {
						    		setCategoryIdControl(e);
						    	}
						    } />
                        </div>
                         <div className="my-4">
                            <Dragger {...uploadProps}>
                            <div className="font-bold mb-2">
                                <UploadOutlined style={
                                    {
                                        fontSize: "2rem",
                                        color: infoColor
                                    }
                                } />
                            </div>
                            <div className="font-semibold text-base">Klik atau Drag Gambar untuk memilih Photo User SPV</div>
                            </Dragger>
                        </div>
					</Spin>
				</div>
			</Modal>

			<Modal title="Edit Product" width={ 800 } 
			okButtonProps={
				{
					icon: <SaveOutlined />,
					disabled: !codeControl || !nameControl || !purchasePriceControl || !sellingPriceControl
					|| !stockControl || !discountControl || !categoryIdControl
				}
			} okText="Submit" onOk={ updateData }
			open={ isEditModalOpen } onCancel={ closeEditModal }>
				<div className="p-2">
					<Spin spinning={ isLoadingSubmit } tip="Updating Data..."
					size="large">
						<div className="my-2">
                            <div className="text-base font-semibold mb-1">Code</div>
                            <Input size="large" placeholder="Product Code" value={ codeControl } 
                                onChange={
                                (e) => {
                                    	setCodeControl(e.target.value);
                                	}
                                } 
                            />
                        </div>
                        <div className="my-2">
                            <div className="text-base font-semibold mb-1">Name</div>
                            <Input size="large" placeholder="Product Name" value={ nameControl } 
                                onChange={
                                (e) => {
                                    	setNameControl(e.target.value);
                                	}
                                } 
                            />
                        </div>
                        <div className="my-2">
                            <div className="text-base font-semibold mb-1">Purchase Price</div>
                            <Input size="large" placeholder="Purchase Price" value={ purchasePriceControl } 
                                onChange={
                                (e) => {
                                		const transformedValue = maskitoTransform(e.target.value, maskitoCurrencyOptions);
                                    	setPurchasePriceControl(transformedValue);
                                	}
                                } 
                            />
                        </div>
                        <div className="my-2">
                            <div className="text-base font-semibold mb-1">Selling Price</div>
                            <Input size="large" placeholder="Selling Price" value={ sellingPriceControl } 
                                onChange={
                                (e) => {
                                		const transformedValue = maskitoTransform(e.target.value, maskitoCurrencyOptions);
                                    	setSellingPriceControl(transformedValue);
                                	}
                                } 
                            />
                        </div>
                        <div className="my-2">
                            <div className="text-base font-semibold mb-1">Stock</div>
                            <Input size="large" placeholder="Product Code" type="number" value={ stockControl } 
                                onChange={
                                (e) => {
                                    	setStockControl(e.target.value);
                                	}
                                } 
                            />
                        </div>
                        <div className="my-2">
                            <div className="text-base font-semibold mb-1">Discount</div>
                            <Input size="large" placeholder="Product Code" value={ discountControl } 
                                onChange={
                                (e) => {
                                		const transformedValue = maskitoTransform(e.target.value, maskitoPercentOptions);
                                    	setDiscountControl(transformedValue);
                                	}
                                } 
                            />
                        </div>
                        <div className="my-2">
                            <div className="text-base font-semibold mb-1">Category</div>
                            <Select size="large" placeholder="Select Category" className="w-full"
                            showSearch optionFilterProp="label" 
                            defaultValue={ categoryIdControl }
                            filterSort={(optionA, optionB) =>
						      (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
						    } options={
						    	categoryList.map(d => {
						    		return { value: d.id, label: d.name }
						    	})
						    } onChange={
						    	(e) => {
						    		setCategoryIdControl(e);
						    	}
						    } />
                        </div>
                         <div className="my-4">
                            <Dragger {...uploadProps}>
                            <div className="font-bold mb-2">
                                <UploadOutlined style={
                                    {
                                        fontSize: "2rem",
                                        color: infoColor
                                    }
                                } />
                            </div>
                            <div className="font-semibold text-base">Klik atau Drag Gambar untuk memilih Photo User SPV</div>
                            </Dragger>
                        </div>
					</Spin>
				</div>
			</Modal>

			<PageTitleComponent title="Product" subtitle="Dashboard" />

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
	                                    <th>Image</th>
	                                    <th>Name</th>
	                                    <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                    	dataList.length == 0 ? <></> :
                                    	dataList.map((d, index) => (
	                                    <tr key={ index }>
	                                        <td>
	                                        	<Avatar shape="square" size={ 48 } src={
	                                                `${baseUrlProductImage}/${d.image}`
	                                            }></Avatar>
	                                        </td>
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
	                                            <Popconfirm title="Delete Product" description={
	                                            `Are you sure want to delete this ${d.name} Product data???`
	                                            } 
	                                            okText="Delete" 
	                                            cancelText="Cancel"
	                                            onConfirm={ 
	                                            (e) => {
	                                                	deleteData(d.id, d.image);
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