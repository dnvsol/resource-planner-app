#!/bin/bash
ssh -p 65002 u556802886@37.44.245.140 'cd ~/domains/dnvsol.org/app && git pull && rm -f apps/web/tsconfig.tsbuildinfo apps/api/tsconfig.tsbuildinfo packages/shared/tsconfig.tsbuildinfo && npm run build && touch ~/domains/dnvsol.org/public_html/tmp/restart.txt && echo "Deploy complete!"'
