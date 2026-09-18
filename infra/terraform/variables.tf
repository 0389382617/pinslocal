variable "do_token" {
  description = "DigitalOcean API token (tao o: cloud.digitalocean.com/account/api/tokens)"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "Vung dat droplet. sgp1 = Singapore, gan Viet Nam nhat trong danh sach DigitalOcean."
  type        = string
  default     = "sgp1"
}

variable "droplet_size" {
  description = "Cau hinh droplet. s-1vcpu-1gb dung cau hinh 1CPU/1RAM da hoc; doi sang s-1vcpu-2gb neu build tren VPS bi thieu RAM."
  type        = string
  default     = "s-1vcpu-1gb"
}

variable "ssh_public_key_path" {
  description = "Duong dan file public key dung de SSH vao droplet."
  type        = string
  default     = "~/.ssh/pinslocal_deploy.pub"
}
