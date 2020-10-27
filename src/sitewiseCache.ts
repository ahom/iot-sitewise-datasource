import { DataFrameView, SelectableValue } from '@grafana/data';
import { DataSource } from 'DataSource';
import { ListAssetsQuery, QueryType } from 'types';
import { AssetModelSummary, AssetSummary, DescribeAssetResult } from './queryResponseTypes';
import { AssetPropertyInfo, AssetInfo } from './types';
import { map } from 'rxjs/operators';

/**
 * Keep a differnt cache for each region
 */
export class SitewiseCache {
  private models?: DataFrameView<AssetModelSummary>;
  private assetsById = new Map<string, AssetInfo>();
  private topLevelAssets?: DataFrameView<AssetSummary>;

  constructor(private ds: DataSource, private region: string) {}

  async getAssetInfo(id: string): Promise<AssetInfo> {
    const v = this.assetsById.get(id);
    if (v) {
      return Promise.resolve(v);
    }

    return this.ds
      .runQuery(
        {
          refId: 'getAssetInfo',
          queryType: QueryType.DescribeAsset,
          assetId: id,
          region: this.region,
        },
        1000
      )
      .pipe(
        map(res => {
          if (res.data.length) {
            const view = new DataFrameView<DescribeAssetResult>(res.data[0]);
            if (view && view.length) {
              const info = frameToAssetInfo(view.get(0));
              this.assetsById.set(id, info);
              return info;
            }
          }
          throw 'asset not found';
        })
      )
      .toPromise();
  }

  async getModels(): Promise<DataFrameView<AssetModelSummary>> {
    if (this.models) {
      return Promise.resolve(this.models);
    }

    return this.ds
      .runQuery({
        refId: 'getModels',
        queryType: QueryType.ListAssetModels,
        region: this.region,
      })
      .pipe(
        map(res => {
          if (res.data.length) {
            this.models = new DataFrameView<AssetModelSummary>(res.data[0]);
            return this.models;
          }
          throw 'no models found';
        })
      )
      .toPromise();
  }

  async getTopLevelAssets(): Promise<DataFrameView<AssetSummary>> {
    if (this.topLevelAssets) {
      return Promise.resolve(this.topLevelAssets);
    }
    const query: ListAssetsQuery = {
      refId: 'topLevelAssets',
      queryType: QueryType.ListAssets,
      filter: 'TOP_LEVEL',
      region: this.region,
    };
    return this.ds
      .runQuery(query, 1000)
      .pipe(
        map(res => {
          if (res.data.length) {
            this.topLevelAssets = new DataFrameView<AssetSummary>(res.data[0]);
            return this.topLevelAssets;
          }
          throw 'no assets found';
        })
      )
      .toPromise();
  }

  async getAssetPickerOptions(): Promise<Array<SelectableValue<string>>> {
    const options: Array<SelectableValue<string>> = [];
    try {
      const topLevel = await this.getTopLevelAssets();
      for (const asset of topLevel) {
        options.push({
          label: asset.name,
          value: asset.id,
          description: asset.arn,
        });
      }
    } catch (err) {
      console.log('Error reading top level assests', err);
    }

    // Also add recent values
    for (const asset of this.assetsById.values()) {
      options.push({
        label: asset.name,
        value: asset.id,
        description: asset.arn,
      });
    }
    return options;
  }
}

export function frameToAssetInfo(res: DescribeAssetResult): AssetInfo {
  const properties: AssetPropertyInfo[] = JSON.parse(res.properties);
  for (const p of properties) {
    p.value = p.Id;
    p.label = p.Name;

    if (p.Unit) {
      p.label += ' (' + p.Unit + ')';
    }

    if (p.DataType) {
      p.description = p.DataType;
      if (p.Alias) {
        p.description += ' // ' + p.Alias;
      }
    }
  }

  return {
    ...res,
    properties,
  };
}