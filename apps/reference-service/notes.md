```ts

class FileUploadValidator {
  async canUpload(params: {
    userId: string;
    organizationId?: string;
    modelName: string;
    purpose: string;
    fileSize: number;
  }): Promise<ValidationResult> {
    // Determine tier
    const tier = params.organizationId 
      ? await this.getOrgTier(params.organizationId)
      : await this.getUserTier(params.userId);
    
    // Get scope
    const scope = await prisma.fileUsageScope.findUnique({
      where: {
        modelName_purpose: {
          modelName: params.modelName,
          purpose: params.purpose
        }
      },
      include: {
        rules: {
          where: {
            OR: [
              { tier: tier },
              { tier: 'default' }
            ],
            voided: false
          }
        }
      }
    });
    
    if (!scope) {
      return { allowed: true, reason: 'No restrictions defined' };
    }
    
    // Get tier-specific or default rule
    const rule = scope.rules.find(r => r.tier === tier) 
      ?? scope.rules.find(r => r.tier === 'default');
    
    if (!rule) {
      return { allowed: false, reason: 'No valid rule found' };
    }
    
    // Check file count
    const currentCount = await prisma.fileMetadata.count({
      where: {
        uploadedById: params.userId,
        organizationId: params.organizationId,
        relatedModelName: params.modelName,
        purpose: params.purpose,
        voided: false
      }
    });
    
    if (currentCount >= rule.maxFiles) {
      return {
        allowed: false,
        reason: `File limit reached (${rule.maxFiles} for ${tier} tier)`,
        current: currentCount,
        limit: rule.maxFiles
      };
    }
    
    // Check total size if rule specifies
    if (rule.maxSize) {
      const totalSize = await prisma.fileMetadata.aggregate({
        where: {
          uploadedById: params.userId,
          organizationId: params.organizationId,
          relatedModelName: params.modelName,
          purpose: params.purpose,
          voided: false
        },
        _sum: { blob: { size: true } }
      });
      
      const currentSize = Number(totalSize._sum.blob?.size ?? 0);
      if (currentSize + params.fileSize > Number(rule.maxSize)) {
        return {
          allowed: false,
          reason: `Storage limit reached`,
          currentSize,
          limit: Number(rule.maxSize)
        };
      }
    }
    
    return { 
      allowed: true,
      current: currentCount,
      limit: rule.maxFiles,
      tier
    };
  }
}
```