using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace PetOmiPlatform.API.Swagger;

public class FileUploadOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var parameters = operation.Parameters;
        if (parameters == null) return;

        foreach (var param in parameters.ToList())
        {
            if (param is OpenApiParameter openApiParam &&
                openApiParam.Schema != null &&
                openApiParam.Schema.Type == "string" &&
                openApiParam.Schema.Format == "binary")
            {
                openApiParam.Schema.Type = "file";
                openApiParam.Schema.Format = null;
            }
        }
    }
}
