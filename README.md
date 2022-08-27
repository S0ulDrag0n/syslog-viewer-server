## Description

I started this project since I was looking for a way to view syslog server mesages sent from one of my servers effortlessly. Unfortunately, I didn't find a solution out of the numerous syslog packages out there so I built a simple UI around one. Since my syslog messages were stored on a RPI, I had to ensure this _also_ works on a RPI4.

Credits to **damoclark** for [simple-syslog-server](https://github.com/damoclark/simple-syslog-server).
Credits to **linuxserver** for a RPI [mariadb](https://hub.docker.com/r/linuxserver/mariadb) image.

## How to use

1. Edit the `.env` file with your docker environment variables.
2. Edit the `docker-compose.yml` as necessary. Especially if you would like to configure where your DB data is stored.
3. Start the images with `docker-compose up -d`.
