package sitewise

import (
	"context"

	"github.com/grafana/iot-sitewise-datasource/pkg/framer"

	"github.com/aws/aws-sdk-go/aws"

	"github.com/aws/aws-sdk-go/service/iotsitewise"
	"github.com/grafana/iot-sitewise-datasource/pkg/models"
	"github.com/grafana/iot-sitewise-datasource/pkg/sitewise/client"
)

func GetAssetPropertyDescription(ctx context.Context, client client.Client, query models.DescribeAssetPropertyQuery) (*framer.AssetProperty, error) {

	awsReq := &iotsitewise.DescribeAssetPropertyInput{
		AssetId:    aws.String(query.AssetId),
		PropertyId: aws.String(query.PropertyId),
	}

	resp, err := client.DescribeAssetPropertyWithContext(ctx, awsReq)
	if err != nil {
		return nil, err
	}

	return &framer.AssetProperty{
		AssetId:       resp.AssetId,
		AssetModelId:  resp.AssetModelId,
		AssetName:     resp.AssetName,
		AssetProperty: resp.AssetProperty,
	}, nil
}
