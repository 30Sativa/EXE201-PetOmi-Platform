import {useForm } from "react-hook-form";
import {zodResolver } from "@hookform/resolvers/zod";

import { LoginRequestSchema, type LoginRequest } from "../schemas/auth.schema";


import { loginApi } from "../services/auth.service";


export default function LoginPage() {
    const{
        register,
        handleSubmit,
        formState: {errors},
    } = useForm<LoginRequest>({
        resolver: zodResolver(LoginRequestSchema),
    });

    const onSubmit = async (data: LoginRequest) => {
        try{
            const response  = await loginApi({...data, deviceId: crypto.randomUUID()}); 
            console.log(response);

            alert("Đăng nhập thành công");


        }catch (error : any) {
            console.log(error.response?.data || error.message);
            alert("Đăng nhập thất bại: " + (error.response?.data?.message || error.message));
        }
       
    };

    return(
        <form onSubmit={handleSubmit(onSubmit)}>
            {/* Your form fields here */}
            <div>
                <input placeholder="Email" {...register("email")} />
                <p>
                     {errors.email?.message}
                     </p>
            </div>
            <div>
                <input placeholder="Password" type="password" {...register("password")} />
                <p>
                    {
                        errors.password ?.message
                    }
                </p>
            </div>
            <button type="submit">Login</button>
        </form>
    );
}