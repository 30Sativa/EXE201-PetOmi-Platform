import { useQuery } from "@tanstack/react-query"

import { getMyClinicApi } from "@/services/clinic.service"

export function useMyClinic() {
  return useQuery({
    queryKey: ["clinic", "my-clinic"],
    queryFn: getMyClinicApi,
    retry: false,
    staleTime: 60 * 1000,
  })
}

