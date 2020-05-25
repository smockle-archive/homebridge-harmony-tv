import http from "http";

export function request(
  options: string | http.RequestOptions | URL,
  body: any
) {
  return new Promise<string>((resolve, reject) => {
    const request = http.request(options, (response) => {
      const data: Uint8Array[] = [];
      response.on("data", (chunk) => data.push(chunk));
      response.on("end", () => {
        resolve(JSON.parse(Buffer.concat(data).toString()).data.activeRemoteId);
      });
    });
    request.on("error", (error) => reject(error));
    request.write(body);
    request.end();
  });
}
