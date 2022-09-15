import { Request } from "express";
export interface u_req extends Request {
  user?: any;
}
