declare type CreateObjectURLCompat = (
  obj: Blob | MediaSource | MediaStream,
) => string;

declare interface HTMLVideoElement {
  mozSrcObject?: HTMLVideoElement["srcObject"];
}

declare interface MediaStreamTrack {
  getCapabilities?: MediaStreamTrack["getCapabilities"];
}
