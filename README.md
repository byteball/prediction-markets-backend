# prediction markets backend

## Installation

Install node.js 14+, clone the repository, then

`npm install`

By default the API is accessible at `http://localhost:5000` (`http://localhost:5001` for testnet). You may want to setup a reverse proxy like Nginx to make it accessible on a public url.

## Warning

Frontend and backend must be in the same directory and keep original folder names

## Run
`npm run load-emblems` (once upon first launch)
`npm run start`

## Nginx
```text
server {
	listen 80;
	server_name localhost;

	location / {
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection "upgrade";
		proxy_pass http://127.0.0.1:4200;
	}

	location ~ \.(js|ico|svg|css|png|jpeg|json) {
		root /path/to/build;
	}
}
```

## Donations

We accept donations through [Kivach](https://kivach.org) and forward a portion of the donations to other open-source projects that made Prophet possible.

[![Kivach](https://kivach.org/api/banner?repo=byteball/prediction-markets-backend)](https://kivach.org/repo/byteball/prediction-markets-backend)
