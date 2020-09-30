import { Response } from "typera-koa";

export interface Errors<T> {
    errors: Partial<T>;
}

export interface Data<T> {
    data: T;
}

export type CollectionResponse<T> = Response.Ok<Data<T[]>>;

export type ResourceResponse<T> =
    | Response.Ok<Data<T>>
    | Response.NotFound;

export type CreateResponse<TAttrs, T> =
    | Response.Ok<Data<T>>
    | Response.BadRequest<Errors<TAttrs>>
    | Response.NotFound;

export type UpdateResponse<TAttrs, T> =
    | Response.Ok<Data<T>>
    | Response.BadRequest<Errors<TAttrs>>
    | Response.NotFound;

export type DeleteResponse = Response.Ok | Response.NotFound;
