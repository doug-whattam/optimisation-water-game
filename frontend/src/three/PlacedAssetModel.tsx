/**
 * Renders one placed pipework asset, assembled from the shared primitives in
 * PipeParts.
 *
 * Base orientation (0°) matches ASSET_PORTS in types: north is -Z, east is +X.
 * A clockwise port rotation of `d` degrees corresponds to a -d rotation about Y
 * in three.js coordinates.
 */
import { memo } from 'react'
import type { PlacedAsset } from '@/types'
import { AssetType, Direction } from '@/types'
import { Bend, Collar, Flange, Gauge, StraightRun, Stub, type PipeSkin } from './PipeParts'

interface Props {
  asset: PlacedAsset
  /** Animate water through this asset (it is fed from the reservoir). */
  wet?: boolean
  skin?: PipeSkin
}

function PlacedAssetModel({ asset, wet = false, skin = 'metal' }: Props) {
  return (
    <group rotation={[0, -(asset.rotation_degrees * Math.PI) / 180, 0]}>
      <AssetGeometry type={asset.asset_type} wet={wet} skin={skin} />
    </group>
  )
}

export function AssetGeometry({
  type,
  wet = false,
  skin = 'metal',
}: {
  type: AssetType
  wet?: boolean
  skin?: PipeSkin
}) {
  const solid = skin === 'metal'

  switch (type) {
    case AssetType.Pipe:
      return (
        <>
          <StraightRun wet={wet} skin={skin} />
          <Flange dir={Direction.North} skin={skin} />
          <Flange dir={Direction.South} skin={skin} />
        </>
      )

    case AssetType.Elbow:
      return (
        <>
          <Bend wet={wet} skin={skin} />
          <Flange dir={Direction.North} skin={skin} />
          <Flange dir={Direction.East} skin={skin} />
        </>
      )

    case AssetType.Tee:
      return (
        <>
          <StraightRun wet={wet} skin={skin} />
          <Stub dir={Direction.East} wet={wet} skin={skin} />
          <Collar skin={skin} />
          <Flange dir={Direction.North} skin={skin} />
          <Flange dir={Direction.South} skin={skin} />
          <Flange dir={Direction.East} skin={skin} />
          {solid && <Gauge />}
        </>
      )

    case AssetType.Cross:
      return (
        <>
          <StraightRun wet={wet} skin={skin} />
          <Stub dir={Direction.East} wet={wet} skin={skin} />
          <Stub dir={Direction.West} wet={wet} skin={skin} />
          <Collar skin={skin} />
          <Flange dir={Direction.North} skin={skin} />
          <Flange dir={Direction.South} skin={skin} />
          <Flange dir={Direction.East} skin={skin} />
          <Flange dir={Direction.West} skin={skin} />
          {solid && <Gauge />}
        </>
      )

    default:
      return null
  }
}

export default memo(PlacedAssetModel)
