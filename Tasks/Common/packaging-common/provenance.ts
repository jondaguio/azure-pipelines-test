import * as tl from "vsts-task-lib";

import * as VsoBaseInterfaces from 'vso-node-api/interfaces/common/VsoBaseInterfaces';
import { ClientVersioningData } from 'vso-node-api/VsoClient';
import vstsClientBases = require("vso-node-api/ClientApiBases");

import * as restclient from 'typed-rest-client/RestClient';

export interface SessionRequest {
    /**
     * Generic property bag to store data about the session
     */
    data: { [key: string] : string; };
    /**
     * The feed name or id for the session
     */
    feed: string;
    /**
     * The type of session If a known value is provided, the Data dictionary will be validated for the presence of properties required by that type
     */
    source: string;
}

export interface SessionResponse {
    /**
     * The identifier for the session
     */
    sessionId: string;
}

export class ProvenanceHelper {
    /* Creates a session request with default data provided by the build variables */
    public static CreateSessionRequest(feedId: string): SessionRequest {

        var releaseId = tl.getVariable("Release.ReleaseId");
        if (releaseId != null) {
            return ProvenanceHelper.CreateReleaseSessionRequest(feedId, releaseId);
        }

        var buildId = tl.getVariable("Build.BuildId");
        if (buildId != null) {
            return ProvenanceHelper.CreateBuildSessionRequest(feedId, buildId);
        }

        // throw
    }

    private static CreateReleaseSessionRequest(feedId: string, releaseId: string): SessionRequest {
        let releaseData = {
            "System.CollectionId": tl.getVariable("System.CollectionId"),
            "System.TeamProjectId": tl.getVariable("System.TeamProjectId"),
            "Release.ReleaseId": releaseId,
            "Release.ReleaseName": tl.getVariable("Release.ReleaseName"),
            "Release.DefinitionName": tl.getVariable("Release.DefinitionName"),
            "Release.DefinitionId": tl.getVariable("Release.DefinitionId")
        }

        var sessionRequest: SessionRequest = { 
            feed: feedId,
            source: "InternalRelease",
            data: releaseData
        }

        return sessionRequest;
    }

    private static CreateBuildSessionRequest(feedId: string, buildId: string): SessionRequest {
        let buildData = {
            "System.CollectionId": tl.getVariable("System.CollectionId"),
            "System.TeamProjectId": tl.getVariable("System.TeamProjectId"),
            "Build.BuildId": buildId,
            "Build.BuildNumber": tl.getVariable("Build.BuildNumber"),
            "Build.DefinitionName": tl.getVariable("Build.DefinitionName"),
            "Build.Repository.Name": tl.getVariable("Build.Repository.Name"),
            "Build.Repository.Provider": tl.getVariable("Build.Repository.Provider"),
            "Build.Repository.Id": tl.getVariable("Build.Repository.Id"),
            "Build.SourceBranch": tl.getVariable("Build.SourceBranch"),
            "Build.SourceBranchName": tl.getVariable("Build.SourceBranchName"),
            "Build.SourceVersion": tl.getVariable("Build.SourceVersion")
        }

        var sessionRequest: SessionRequest = { 
            feed: feedId,
            source: "InternalBuild",
            data: buildData
        }

        return sessionRequest;
    }
}

export class ProvenanceApi extends vstsClientBases.ClientApiBase {
    constructor(baseUrl: string, handlers: VsoBaseInterfaces.IRequestHandler[], options?: VsoBaseInterfaces.IRequestOptions) {
        super(baseUrl, handlers, "node-packageprovenance-api", options);
    }

    /**
     * Creates a session, a wrapper around a feed that can store additional metadata on the packages published to the session.
     * 
     * @param {SessionRequest} sessionRequest - The feed and metadata for the session
     * @param {string} protocol - The protocol that the session will target
     */
    public async createSession(
        sessionRequest: SessionRequest,
        protocol: string
        ): Promise<SessionResponse> {

        return new Promise<SessionResponse>(async (resolve, reject) => {

            let routeValues: any = {
                protocol: protocol
            };

            try {
                let verData: ClientVersioningData = await this.vsoClient.getVersioningData(
                    "5.0-preview.1",
                    "Provenance",
                    "503B4E54-EBF4-4D04-8EEE-21C00823C2AC",
                    routeValues);

                let url: string = verData.requestUrl;

                let options: restclient.IRequestOptions = this.createRequestOptions('application/json', 
                                                                                verData.apiVersion);

                let res: restclient.IRestResponse<SessionResponse>;
                res = await this.rest.create<SessionResponse>(url, sessionRequest, options);
                let ret = this.formatResponse(res.result,
                                              null,
                                              false);

                resolve(ret);
            }
            catch (err) {
                reject(err);
            }
        });
    }
}

