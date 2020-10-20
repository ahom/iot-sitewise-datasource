package sitewise

import (
	"context"

	"github.com/grafana/iot-sitewise-datasource/pkg/framer"

	"github.com/grafana/iot-sitewise-datasource/pkg/sitewise/client"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/iotsitewise"
	"github.com/grafana/iot-sitewise-datasource/pkg/models"
)

func GetAssetDescription(ctx context.Context, client client.Client, query models.DescribeAssetQuery) (*framer.AssetDescription, error) {

	awsReq := &iotsitewise.DescribeAssetInput{AssetId: aws.String(query.AssetId)}

	resp, err := client.DescribeAssetWithContext(ctx, awsReq)

	if err != nil {
		return nil, err
	}

	return &framer.AssetDescription{
		AssetArn:            resp.AssetArn,
		AssetCreationDate:   resp.AssetCreationDate,
		AssetHierarchies:    resp.AssetHierarchies,
		AssetId:             resp.AssetId,
		AssetLastUpdateDate: resp.AssetLastUpdateDate,
		AssetModelId:        resp.AssetModelId,
		AssetName:           resp.AssetName,
		AssetProperties:     resp.AssetProperties,
		AssetStatus:         resp.AssetStatus,
	}, nil
}
