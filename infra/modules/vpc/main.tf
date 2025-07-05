# ============================================================================
# VPC MODULE FOR LAB PROJECT
# ----------------------------------------------------------------------------
# Minimal VPC setup with public subnets only
# No private subnets or NAT Gateway to save costs
# ============================================================================

# ============================================================================
# VPC
# ============================================================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = merge(var.tags, {
    Name = "${var.environment}-${var.vpc_basename}"
  })
}

# ============================================================================
# INTERNET GATEWAY
# ============================================================================

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.vpc_basename}-igw"
  })
}

# ============================================================================
# PUBLIC SUBNETS
# ============================================================================

resource "aws_subnet" "public" {
  count             = length(var.public_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.public_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.vpc_basename}-public-subnet-${count.index + 1}"
  })
}

# ============================================================================
# ROUTE TABLE FOR PUBLIC SUBNETS
# ============================================================================

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.vpc_basename}-public-rt"
  })
}

resource "aws_route_table_association" "public" {
  count          = length(var.public_subnet_cidrs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ============================================================================
# SECURITY GROUP FOR LAB ACCESS
# ============================================================================

resource "aws_security_group" "lab_access" {
  name_prefix = "${var.environment}-${var.vpc_basename}-lab-access-"
  vpc_id      = aws_vpc.main.id

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-${var.vpc_basename}-lab-access-sg"
  })
}
