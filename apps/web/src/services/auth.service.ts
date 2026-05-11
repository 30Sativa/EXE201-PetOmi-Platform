import { api } from "../lib/axios";

export const loginApi =  async( data:
    {
        email: string;
        password: string;
        deviceId: string;
    }
) =>{
    const response = await api.post("/auth/login", data);
    return response.data;
}