export interface URLParse {
  auth: string;
  hash: string;
  host: string;
  hostname: string;
  href: string;
  origin: string;
  password: string;
  pathname: string;
  port: string;
  protocol: string;
  query: { [key: string]: string | undefined };
  slashes: boolean;
  username: string;
}
