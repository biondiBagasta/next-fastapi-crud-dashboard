import axios, { AxiosInstance } from "axios";

export const baseUrl = "http://localhost:8200/api";

export const axiosClientJsonContent = axios.create({
	baseURL: baseUrl,
	headers: {
		"Content-Type": "application/json"
	}
});

export const axiosClientSecuredJsonContent: (jwt: string) => AxiosInstance = (jwt: string) => axios.create({
	baseURL: baseUrl,
		headers: {
		"Content-Type": "application/json",
		"Authorization": `Bearer ${jwt}`
	}
});

export default function checkLocalStorage(key: string, defaultValue = ""): string {
    // getting stored value
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(key);
      const initial = saved !== null ? saved : defaultValue;
      return initial;
    } else {
        return defaultValue;
    }
}

// Theme
export const primaryColor = "#526ed3";
export const secondaryColor = "#dedcff";
export const textColor = "#050315";
export const lightTextColor = "#6A6D7F";
export const infoColor = "#4b7bec";
export const successColor = "#3aa981";
export const warningColor = "#ff9f43";
export const errorColor = "#dd4c1e";
export const backgroundColor = "#fbfbfe";
