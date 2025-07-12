# ============================================================================
# VARIABLES FOR BOOTSTRAP INFRASTRUCTURE
# ============================================================================

variable "github_repository" {
  description = "GitHub repository in format 'owner/repo' (e.g., 'your-org/typescript-pulsequeue')"
  type        = string
  default     = "theRealKarlos/typescript-pulsequeue" # Update this with your actual repo
}
