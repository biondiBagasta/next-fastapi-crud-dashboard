import { create } from "zustand";
import { AuthService } from "../services/auth.service";
import { LocalStorageService } from "../services/local-storage.service";
import { CategoryService } from "../services/category.service";
import { ProductService } from "../services/product.service";
import { SupplierService } from "../services/supplier.service";

interface ServiceState {
	authService: AuthService;
	localStorageService: LocalStorageService;
	categoryService: CategoryService;
	productService: ProductService;
	supplierService: SupplierService
}

export const useServiceStore = create<ServiceState>(
	(_) => ({
		authService: new AuthService(),
		localStorageService: new LocalStorageService(),
		categoryService: new CategoryService(),
		productService: new ProductService(),
		supplierService: new SupplierService()
	})
)